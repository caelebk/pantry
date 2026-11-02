import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = path.resolve('../docs/design-evidence/inventory-rollback');
const routes = [
  ['stock', '/inventory/items', 'Ingredient Items'],
  ['ingredients', '/inventory/ingredients', 'Ingredients Catalog'],
  ['groups', '/inventory/groups', 'Ingredient Categories & Groups'],
  ['add-stock', '/inventory/items/new', 'Add New Ingredient Item'],
  ['add-ingredient', '/inventory/ingredients/new', 'Add Ingredient'],
  ['add-group', '/inventory/groups/new', 'Add Ingredient Group'],
] as const;
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`original inventory pages ${width} ${theme}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const state = await installDesignBaseline(page, theme);
      await mkdir(evidence, { recursive: true });
      for (const [name, route, heading] of routes) {
        await page.goto(route);
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await expect(page.locator('pantry-spinner')).toHaveCount(0);
        await expect(
          page.locator(
            'pantry-inventory-toolbar, pantry-inventory-row-actions, pantry-ingredient-editor, pantry-item-editor, pantry-group-membership-editor',
          ),
        ).toHaveCount(0);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: path.join(evidence, `${name}-${width}-${theme}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
      expect(errors).toEqual([]);
      expect(state.unexpectedRequests).toEqual([]);
    });
  }
}
