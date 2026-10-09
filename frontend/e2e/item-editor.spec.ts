import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = path.resolve('../docs/design-evidence/item-editor');
const existingItem = {
  id: 'item-tomato',
  ingredientId: 'ingredient-tomato',
  label: 'Market tomatoes',
  quantity: 450,
  unitId: 1,
  locationId: 2,
  purchaseDate: '2026-10-01',
  expirationDate: '2026-10-06',
  openedDate: '2026-10-02',
  notes: 'Keep in the vegetable drawer.',
};
async function install(page: Page, theme: 'light' | 'dark' = 'light') {
  const state = await installDesignBaseline(page, theme);
  await page.route('**/api/v1/ingredient-items/item-tomato', async (route) => {
    await route.fulfill({ json: { status: 'success', data: existingItem } });
  });
  return state;
}
async function choose(page: Page, id: string, name: string) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', { name, exact: true }).click();
}
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    test(`compact add/edit ${width} ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const state = await install(page, theme);
      await mkdir(evidence, { recursive: true });
      for (const mode of ['add', 'edit']) {
        await page.goto(
          mode === 'add' ? '/inventory/items/new' : '/inventory/items/item-tomato/edit',
        );
        await expect(
          page.getByRole('heading', {
            name: `${mode === 'add' ? 'Add' : 'Edit'} ingredient item`,
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.locator('pantry-item-editor')).toBeVisible();
        await expect(page.locator('#item-details')).toBeHidden();
        await page.waitForLoadState('networkidle');
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.screenshot({
          path: path.join(evidence, `${mode}-${width}-${theme}.png`),
          fullPage: true,
        });
        await page.getByRole('button', { name: 'More details', exact: true }).click();
        await expect(page.locator('#item-details')).toBeVisible();
        if (mode === 'edit') {
          await expect(page.locator('#name')).toHaveValue(existingItem.label);
          await expect(page.locator('#notes')).toHaveValue(existingItem.notes);
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.screenshot({
          path: path.join(evidence, `${mode}-details-${width}-${theme}.png`),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
      expect(state.unexpectedRequests).toEqual([]);
    });
  }
}

test('add validates, fills labels, preserves customization and retries without losing entries', async ({
  page,
}) => {
  const state = await install(page);
  await page.goto('/inventory/items/new');
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click();
  await expect(page.locator('#ingredient')).toBeFocused();
  await expect(page.getByText('Choose an ingredient.', { exact: true })).toBeVisible();
  await choose(page, 'ingredient', 'Baby spinach');
  await expect(page.locator('#name')).toHaveValue('Baby spinach');
  await choose(page, 'ingredient', 'Cherry tomatoes');
  await expect(page.locator('#name')).toHaveValue('Cherry tomatoes');
  await page.locator('#name').fill('Market tomatoes');
  await choose(page, 'ingredient', 'Baby spinach');
  await expect(page.locator('#name')).toHaveValue('Market tomatoes');
  await page.getByRole('button', { name: 'In 1 week', exact: true }).click();
  await page.locator('#notes').fill('Do not lose these notes.');
  await page.getByRole('button', { name: 'More details', exact: true }).click();
  let attempts = 0;
  let payload: Record<string, unknown> = {};
  await page.route('**/api/v1/ingredient-items', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    payload = route.request().postDataJSON();
    attempts++;
    await route.fulfill(
      attempts === 1
        ? { status: 500, json: { status: 'error', message: 'Please retry.' } }
        : { json: { status: 'success', data: { ...existingItem, ...payload, id: 'new-item' } } },
    );
  });
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click();
  await expect(page.locator('pantry-item-editor [role="alert"]')).toContainText('Please retry.');
  await page.getByRole('button', { name: 'More details', exact: true }).click();
  await expect(page.locator('#notes')).toHaveValue('Do not lose these notes.');
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click();
  await expect(page).toHaveURL(/\/inventory\/items$/);
  expect(payload).toMatchObject({
    ingredientId: 'ingredient-spinach',
    label: 'Market tomatoes',
    quantity: 1,
    unitId: 1,
    notes: 'Do not lose these notes.',
  });
  expect(attempts).toBe(2);
  expect(state.unexpectedRequests).toEqual([]);
});

test('edit saves existing optional values while details are collapsed', async ({ page }) => {
  const state = await install(page);
  let payload: Record<string, unknown> = {};
  await page.route('**/api/v1/ingredient-items/item-tomato', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { status: 'success', data: { ...existingItem, ...payload } } });
  });
  await page.goto('/inventory/items/item-tomato/edit');
  await expect(page.locator('pantry-item-editor')).toBeVisible();
  await expect(page.locator('#item-details')).toBeHidden();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL(/\/inventory\/items$/);
  expect(payload).toMatchObject({
    label: existingItem.label,
    notes: existingItem.notes,
    openedDate: existingItem.openedDate,
    quantity: 450,
    unitId: 1,
  });
  expect(state.unexpectedRequests).toEqual([]);
});

test('hidden required purchase date is revealed and focused on submit', async ({ page }) => {
  await install(page);
  await page.goto('/inventory/items/new?ingredientId=ingredient-tomato');
  await expect(page.locator('#ingredient')).toContainText('Cherry tomatoes');
  await page.getByRole('button', { name: 'In 1 week', exact: true }).click();
  await page.getByRole('button', { name: 'More details', exact: true }).click();
  await page.locator('#purchaseDate').fill('');
  await page.locator('#purchaseDate').press('Tab');
  await page.getByRole('button', { name: 'More details', exact: true }).click();
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click();
  await expect(page.locator('#item-details')).toBeVisible();
  await expect(page.locator('#purchaseDate')).toBeFocused();
  await expect(page.getByText('Choose a purchase date.', { exact: true })).toBeVisible();
});
