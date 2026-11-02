import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';
const evidence = path.resolve('../docs/design-evidence/S02');
const routes = [
  { name: 'home', route: '/home', current: 'Home', sidebar: '/home' },
  {
    name: 'items',
    route: '/inventory/items?view=table',
    current: 'Ingredient Items',
    sidebar: '/inventory/items',
  },
  { name: 'profile', route: '/profile', current: 'Profile', sidebar: '/profile' },
  { name: 'stores', route: '/shopping-list/stores', current: 'Stores', sidebar: null },
  {
    name: 'shopping-edit',
    route: '/shopping-list/shopping-rice/edit',
    current: 'Edit shopping item',
    sidebar: null,
  },
  {
    name: 'reconciliation',
    route: '/inventory/ingredients/ingredient-rice/unit-reconciliation?targetUnitId=1',
    current: 'Reconcile units',
    sidebar: null,
  },
  {
    name: 'recipe-edit',
    route: '/recipes/recipe-rice/edit',
    current: 'Edit recipe',
    sidebar: null,
  },
  {
    name: 'group-new',
    route: '/inventory/groups/new',
    current: 'Add ingredient group',
    sidebar: null,
  },
];
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    for (const target of routes) {
      test(`navigation ${target.name} ${width} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const fixture = await installDesignBaseline(page, theme);
        const responses: Record<string, unknown> = {
          '/api/v1/me/sessions': [],
          '/api/v1/shopping-list/shopping-rice': {
            id: 'shopping-rice',
            name: 'Brown rice',
            ingredientId: 'ingredient-rice',
            quantity: 1,
            unit: 'g',
            checked: false,
            source: 'manual',
          },
          '/api/v1/ingredients/ingredient-rice': {
            id: 'ingredient-rice',
            name: 'Brown rice',
            ingredientGroupId: 2,
            defaultUnitId: 1,
          },
          '/api/v1/ingredients/ingredient-rice/items': [],
          '/api/v1/recipes/recipe-rice': {
            id: 'recipe-rice',
            name: 'Tomato and brown rice bowl',
            ingredients: [],
            steps: [],
            prepTime: 10,
            cookTime: 25,
            servings: 2,
          },
        };
        await page.route('**/api/**', async (route) => {
          const key = new URL(route.request().url()).pathname;
          if (route.request().method() === 'GET' && Object.hasOwn(responses, key)) {
            return route.fulfill({ json: { status: 'success', data: responses[key] } });
          }
          return route.fallback();
        });
        await page.goto(target.route);
        const breadcrumbs = page.locator('pantry-breadcrumbs nav');
        await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveText(target.current);
        await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveCount(1);
        const sidebar = page.locator('pantry-sidebar');
        const currentLinks = sidebar.locator('a[aria-current="page"]');
        await expect(currentLinks).toHaveCount(target.sidebar ? 1 : 0);
        if (target.sidebar) await expect(currentLinks).toHaveAttribute('href', target.sidebar);
        await expect(sidebar.locator('a[href="/recipes"]')).toHaveCount(1);
        await expect(sidebar.locator('button[aria-expanded]')).not.toHaveCount(0);
        const geometry = await breadcrumbs.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const visible = [...el.querySelectorAll('li')].filter(
            (item) => getComputedStyle(item).display !== 'none',
          );
          return {
            overflow: el.scrollWidth > el.clientWidth + 1,
            right: rect.right,
            visible: visible.length,
          };
        });
        expect(geometry.overflow).toBe(false);
        expect(geometry.right).toBeLessThanOrEqual(width + 1);
        if (width < 640) expect(geometry.visible).toBeLessThanOrEqual(2);
        await page.waitForLoadState('networkidle');
        await mkdir(evidence, { recursive: true });
        await page.screenshot({
          path: path.join(evidence, `${target.name}-${width}-${theme}.png`),
        });
        const parent = breadcrumbs.locator('a:visible').last();
        if (await parent.count()) {
          const href = await parent.getAttribute('href');
          await parent.focus();
          await expect(parent).toBeFocused();
          await expect(parent).toHaveCSS('outline-style', 'solid');
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(new RegExp(`${href}$`));
        }
        expect(errors).toEqual([]);
        expect(fixture.unexpectedRequests).toEqual([]);
      });
    }
  }
}
