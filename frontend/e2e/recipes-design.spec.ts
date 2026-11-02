import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = '/tmp/pantry-recipes-redesign';
for (const width of [1440, 1280, 390, 320]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`recipes browse ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const fixture = await installDesignBaseline(page, theme);
      await page.goto('/recipes');
      const cards = page.locator('pantry-recipe-card');
      await expect(cards).toHaveCount(2);
      await expect(cards.first()).toContainText('2 of 2 in stock');
      await expect(cards.first().locator('.progress-track')).toHaveCount(1);
      await expect(cards.locator('.recipe-ingredient-status')).toHaveCount(0);
      await expect(cards.locator('.recipe-expiry')).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await mkdir(evidence, { recursive: true });
      await page.screenshot({ path: `${evidence}/recipes-${width}-${theme}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const title = cards.first().getByRole('heading');
      await expect(title).toHaveText('Tomato and brown rice bowl');
      expect(await title.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.getByRole('button', { name: 'Ready', exact: true }).click();
      await expect(cards).toHaveCount(1);
      await expect(cards.first()).toContainText('Tomato and brown rice bowl');
      await page.getByRole('button', { name: 'Missing', exact: true }).click();
      await expect(cards).toHaveCount(1);
      await expect(cards.first()).toContainText('Spinach and roasted');
      await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
      await expect(cards).toHaveCount(2);
      await page.getByRole('combobox', { name: 'Time', exact: true }).click();
      await page.getByRole('option', { name: '30 minutes or less', exact: true }).click();
      await expect(cards).toHaveCount(1);
      await expect(cards.first()).toContainText('Spinach and roasted');
      await page.screenshot({ path: `${evidence}/filters-${width}-${theme}.png`, fullPage: true });
      await page
        .getByRole('textbox', { name: 'Search recipes...', exact: true })
        .fill('no-such-recipe');
      await expect(page.getByText('No recipes match', { exact: true })).toBeVisible();
      await page
        .locator('pantry-empty-state')
        .getByRole('button', { name: 'Clear filters' })
        .click();
      await expect(cards).toHaveCount(2);
      const link = cards.first().getByRole('link').first();
      await expect(link).toHaveAttribute('href', '/recipes/recipe-rice');
      await link.focus();
      await expect(link).toBeFocused();
      expect(errors).toEqual([]);
      expect(fixture.unexpectedRequests).toEqual([]);
    });
  }
}

for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`full recipe grid ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await installDesignBaseline(page, theme);
      await page.route('**/api/v1/recipes', async (route) => {
        await route.fulfill({
          json: {
            success: true,
            data: [
              {
                id: 'rice',
                name: 'Tomato Rice Bowl',
                description: 'A quick rice bowl with tomatoes and pantry staples.',
                servings: 2,
                prepTime: 5,
                cookTime: 10,
                difficulty: 'Easy',
                ingredients: [
                  { ingredientId: 'ingredient-rice', quantity: 200, unitId: 1 },
                  { ingredientId: 'ingredient-tomato', quantity: 100, unitId: 1 },
                ],
                steps: [],
              },
              {
                id: 'pancakes',
                name: 'Spinach Rice Soup',
                description: 'A warming spinach and rice soup for a weekend lunch.',
                servings: 4,
                prepTime: 10,
                cookTime: 15,
                difficulty: 'Easy',
                ingredients: [
                  { ingredientId: 'ingredient-spinach', quantity: 100, unitId: 1 },
                  { ingredientId: 'ingredient-rice', quantity: 2000, unitId: 1 },
                ],
                steps: [],
              },
              {
                id: 'bread',
                name: 'Baked Spinach with Lemon, Garlic and a Crispy Breadcrumb Topping',
                description:
                  'Tender baked spinach with a crisp topping, served warm alongside your favourite main for a relaxed weekend meal.',
                servings: 8,
                prepTime: 15,
                cookTime: 60,
                difficulty: 'Medium',
                ingredients: [{ ingredientId: 'ingredient-spinach', quantity: 100, unitId: 1 }],
                steps: [],
              },
              {
                id: 'pasta',
                name: 'Creamy Rice Porridge',
                description: 'A simple rice porridge for an easy weekday breakfast.',
                servings: 2,
                prepTime: 5,
                cookTime: 15,
                difficulty: 'Easy',
                ingredients: [{ ingredientId: 'ingredient-rice', quantity: 2000, unitId: 1 }],
                steps: [],
              },
            ],
          },
        });
      });
      await page.goto('/recipes');
      const cards = page.locator('pantry-recipe-card');
      await expect(cards).toHaveCount(4);
      await expect(cards.filter({ hasText: 'Creamy Rice Porridge' })).toContainText('More needed');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `${evidence}/full-grid-${width}-${theme}.png`,
        fullPage: true,
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (width >= 1024) {
        const pantryRows = await cards
          .locator('.recipe-pantry')
          .evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().top));
        const actionRows = await cards
          .locator('.recipe-card__actions')
          .evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().top));
        expect(Math.abs(pantryRows[0] - pantryRows[1])).toBeLessThan(1);
        expect(Math.abs(pantryRows[2] - pantryRows[3])).toBeLessThan(1);
        expect(Math.abs(actionRows[0] - actionRows[1])).toBeLessThan(1);
        expect(Math.abs(actionRows[2] - actionRows[3])).toBeLessThan(1);
      }
      // Status follows the summary with a modest gap, regardless of neighbouring card content.
      for (const card of await cards.all()) {
        const description = await card.locator('p').first().boundingBox();
        const pantry = await card.locator('.recipe-pantry').boundingBox();
        expect(pantry!.y - description!.y - description!.height).toBeLessThan(64);
      }
    });
  }
}

test('recipe card navigation and hover without destructive actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await installDesignBaseline(page, 'dark');
  await page.route('**/api/v1/recipes/recipe-rice', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { id: 'recipe-rice', name: 'Tomato and brown rice bowl', ingredients: [], steps: [] },
      },
    }),
  );
  await page.goto('/recipes');
  const card = page.locator('pantry-recipe-card').first().locator('article');
  const link = card.getByRole('link', { name: 'Tomato and brown rice bowl', exact: true });
  await expect(card.getByRole('link')).toHaveCount(1);
  await expect(card.getByText('View recipe', { exact: true })).toHaveCount(0);
  await link.focus();
  await expect(link).toBeFocused();
  await expect(card).toHaveCSS('outline-style', 'solid');
  await card.hover();
  await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -3)');
  await page.screenshot({ path: `${evidence}/recipe-card-hover-dark.png`, fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card).toHaveCSS('transform', 'none');
  await expect(card.getByRole('button')).toHaveCount(0);
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  await card.click({ position: { x: bounds!.width / 2, y: bounds!.height * 0.7 } });
  await expect(page).toHaveURL(/\/recipes\/recipe-rice$/);
  await page.goBack();
  await page.locator('pantry-recipe-card').first().getByRole('link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/recipes\/recipe-rice$/);
});
