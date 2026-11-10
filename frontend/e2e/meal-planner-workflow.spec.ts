import { expect, test } from '@playwright/test';
import { installDesignBaseline } from './fixtures/design-baseline';

const mealPlans = (data: unknown[]) => ({ json: { status: 'success', data } });

test.describe('Meal Planner Workflow E2E', () => {
  test('should show the planned meal in the week table', async ({ page }) => {
    await installDesignBaseline(page, 'light');
    await page.route('**/api/v1/meal-plans', (route) =>
      route.fulfill(
        mealPlans([
          {
            id: 'mp-1',
            day: 'Monday',
            mealType: 'Dinner',
            recipeName: 'Honey Garlic Salmon',
            servings: 2,
            cooked: false,
            missingIngredients: [],
          },
        ]),
      ),
    );

    await page.goto('/meal-planner');

    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveText([
      'Day',
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snacks',
    ]);
    await expect(table.getByText('Honey Garlic Salmon')).toBeVisible();
    await expect(page.getByText('1 meal planned')).toBeVisible();
  });

  test('should open the plan form from an empty slot', async ({ page }) => {
    await installDesignBaseline(page, 'light');
    await page.route('**/api/v1/meal-plans', (route) => route.fulfill(mealPlans([])));

    await page.goto('/meal-planner');
    await page.getByRole('table').getByRole('button', { name: 'Add dinner on Monday' }).click();

    await expect(page).toHaveURL(/\/meal-planner\/new\?.*day=Monday.*type=Dinner/);
  });
});
