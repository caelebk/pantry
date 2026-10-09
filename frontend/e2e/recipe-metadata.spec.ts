import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';
const evidence = path.resolve('../docs/design-evidence/Q02');
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390]) {
    test(`honest recipe metadata ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const baseline = await installDesignBaseline(page, theme);
      await page.route('**/api/v1/recipes/available', (route) =>
        route.fulfill({
          json: {
            status: 'success',
            data: [
              { id: 'unknown', name: 'Unknown metadata recipe' },
              { id: 'zero', name: 'Recorded zero recipe', prepTime: 0, cookTime: 0, servings: 0 },
            ],
          },
        }),
      );
      await page.route('**/api/v1/meal-plans', (route) =>
        route.fulfill({
          json: {
            status: 'success',
            data: [
              {
                id: 'unknown',
                day: 'Monday',
                mealType: 'Dinner',
                recipeId: 'unknown',
                recipeName: 'Unknown metadata meal',
                prepTimeMinutes: null,
                calories: null,
                servings: null,
                cooked: false,
                missingIngredients: [],
              },
              {
                id: 'zero',
                day: 'Monday',
                mealType: 'Lunch',
                recipeId: 'zero',
                recipeName: 'Recorded zero meal',
                prepTimeMinutes: 0,
                calories: 0,
                servings: 0,
                cooked: false,
                missingIngredients: [],
              },
            ],
          },
        }),
      );
      await mkdir(evidence, { recursive: true });
      await page.goto('/home');
      const home = page.locator('pantry-cookable-recipes-container');
      await expect(home.getByText('Unknown metadata recipe')).toBeVisible();
      await expect(home.locator('.pi-clock')).toHaveCount(1);
      await expect(home.locator('.pi-users')).toHaveCount(1);
      await expect(home.getByText('0m', { exact: true })).toBeVisible();
      await expect(home.getByText('0 serv', { exact: true })).toBeVisible();
      await home.screenshot({ path: path.join(evidence, `home-${width}-${theme}.png`) });
      await page.goto('/meal-planner');
      const weekly = page.locator('pantry-weekly-view');
      await expect(weekly.getByText('Unknown metadata meal', { exact: true })).toBeVisible();
      await expect(weekly).not.toContainText('15m');
      await expect(weekly).not.toContainText('400 kcal');
      await expect(weekly).toContainText('0m');
      await expect(weekly).toContainText('0 kcal');
      await weekly.screenshot({ path: path.join(evidence, `weekly-${width}-${theme}.png`) });
      await page.getByRole('button', { name: 'Daily Focus', exact: true }).click();
      const daily = page.locator('pantry-daily-focus');
      await daily.getByRole('button', { name: 'Monday', exact: true }).click();
      await expect(
        daily.getByRole('heading', { name: 'Unknown metadata meal', exact: true }),
      ).toBeVisible();
      await expect(daily).not.toContainText('15 mins');
      await expect(daily).not.toContainText('400 kcal');
      await expect(daily).toContainText('0 mins');
      await expect(daily).toContainText('0 servings');
      await daily.screenshot({ path: path.join(evidence, `daily-${width}-${theme}.png`) });
      expect(errors).toEqual([]);
      expect(baseline.unexpectedRequests).toEqual([]);
    });
  }
}
