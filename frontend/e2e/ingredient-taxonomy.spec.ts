import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = path.resolve('../docs/design-evidence/ingredient-taxonomy');

async function setup(page: Page, theme: 'light' | 'dark') {
  const state = await installDesignBaseline(page, theme);
  await page.route('**/api/v1/ingredient-groups', (route) =>
    route.fulfill({
      json: {
        status: 'success',
        data: [
          { id: 1, name: 'Vegetables', ingredientCategoryId: 1 },
          { id: 2, name: 'Rice', ingredientCategoryId: 2 },
          { id: 3, name: 'Fresh fruit and seasonal berries', ingredientCategoryId: 1 },
          { id: 4, name: 'To organize' },
        ],
      },
    }),
  );
  return state;
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    test(`taxonomy hierarchy ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const state = await setup(page, theme);
      await page.goto('/inventory/groups');
      const produce = page.getByRole('button', { name: 'Produce', exact: true });
      await expect(produce).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('heading', { name: 'Vegetables', exact: true })).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await mkdir(evidence, { recursive: true });
      await page.screenshot({
        path: path.join(evidence, `groups-${width}-${theme}-collapsed.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await produce.focus();
      await page.keyboard.press('Enter');
      await expect(produce).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('heading', { name: 'Vegetables', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Unclassified', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'To organize', exact: true })).toBeVisible();
      await expect(page.locator('main table')).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText('In Stock');
      await expect(page.locator('main')).not.toContainText('pi pi-box');
      await page.waitForLoadState('networkidle');
      expect(state.servedRequests).not.toContain('GET /api/v1/ingredient-items');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await mkdir(evidence, { recursive: true });
      await page.screenshot({
        path: path.join(evidence, `groups-${width}-${theme}-expanded.png`),
        fullPage: true,
        animations: 'disabled',
      });
      const search = page.getByRole('textbox', {
        name: 'Search categories or groups',
        exact: true,
      });
      await search.fill('Fresh fruit');
      await expect(
        page.getByRole('heading', { name: 'Fresh fruit and seasonal berries', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Produce', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Rice', exact: true })).toHaveCount(0);
      await search.fill('Grains');
      await expect(page.getByRole('heading', { name: 'Rice', exact: true })).toBeVisible();
      await search.fill('To organize');
      await expect(page.getByRole('heading', { name: 'To organize', exact: true })).toBeVisible();
      expect(errors).toEqual([]);
      expect(state.unexpectedRequests).toEqual([]);
    });
  }
}

test('group links override saved catalog filters and return to organization', async ({ page }) => {
  await setup(page, 'light');
  await page.goto('/inventory/ingredients');
  await page.getByRole('textbox', { name: 'Search ingredients', exact: true }).fill('rice');
  await page.getByRole('button', { name: /Out of Stock/ }).click();
  await page.getByRole('link', { name: 'Ingredient Categories & Groups', exact: true }).click();
  await page.getByRole('button', { name: 'Produce', exact: true }).click();
  const link = page.locator('main a[href*="groupId=1"]');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/groupId=1/);
  await expect(page.getByRole('link', { name: 'Baby spinach', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cherry tomatoes', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search ingredients', exact: true })).toHaveValue(
    '',
  );
  await page.getByRole('link', { name: /Back to categories.*groups/i }).click();
  await expect(page).toHaveURL(/\/inventory\/groups$/);
});
