import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline, longIngredientName } from './fixtures/design-baseline';

const evidence = path.resolve('../docs/design-evidence/ingredient-detail');
const ingredient = {
  id: 'ingredient-rice',
  name: longIngredientName,
  ingredientGroupId: 2,
  defaultUnitId: 1,
};
const stock = {
  id: 'item-rice',
  ingredientId: ingredient.id,
  label: longIngredientName,
  quantity: 1250,
  unitId: 1,
  locationId: 1,
  expirationDate: '2027-03-15',
};
async function setup(page: Page, theme: 'light' | 'dark') {
  const state = await installDesignBaseline(page, theme);
  await page.route('**/api/v1/ingredients/ingredient-rice', (route) =>
    route.fulfill({ json: { status: 'success', data: ingredient } }),
  );
  await page.route('**/api/v1/ingredients/ingredient-rice/items', (route) =>
    route.fulfill({ json: { status: 'success', data: [stock] } }),
  );
  await page.route('**/api/v1/ingredient-items/item-rice', (route) =>
    route.fulfill({ json: { status: 'success', data: stock } }),
  );
  return state;
}
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    test(`ingredient detail ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const state = await setup(page, theme);
      await page.goto('/inventory/ingredients/ingredient-rice');
      await expect(
        page.getByRole('heading', { name: longIngredientName, exact: true }),
      ).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await mkdir(evidence, { recursive: true });
      await page.screenshot({
        path: path.join(evidence, `detail-${width}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      expect(errors).toEqual([]);
      expect(state.unexpectedRequests).toEqual([]);
    });
  }
}

test('catalog link, browser back, and item editor preserve context', async ({ page }) => {
  await setup(page, 'light');
  await page.goto('/inventory/ingredients');
  await page.getByRole('textbox', { name: 'Search ingredients', exact: true }).fill('rice');
  const link = page.getByRole('link', { name: longIngredientName, exact: true });
  await expect(link).toBeVisible();
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/ingredients\/ingredient-rice$/);
  await page.goBack();
  await expect(page.getByRole('textbox', { name: 'Search ingredients', exact: true })).toHaveValue(
    'rice',
  );
  await link.click();
  await page.getByRole('link', { name: /add ingredient item/i }).click();
  await expect(page).toHaveURL(/items\/new.*ingredientId=ingredient-rice/);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(/ingredients\/ingredient-rice$/);
});
