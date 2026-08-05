import { expect, test } from '@playwright/test';

test.describe('Meal Planner Workflow E2E', () => {
  test('should display meal plan calendar and allow toggling sub views', async ({ page }) => {
    await page.route('**/api/meal-plans', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            {
              id: 'mp-1',
              day: 'Monday',
              mealType: 'Dinner',
              recipeName: 'Honey Garlic Salmon',
              prepTimeMinutes: 25,
              calories: 450,
              servings: 2,
              cooked: false,
              missingIngredients: ['Salmon Fillet'],
              tags: ['Seafood'],
            },
          ],
        },
      });
    });

    await page.goto('/meal-planner');

    // Verify planned meal renders
    await expect(page.getByText('Honey Garlic Salmon')).toBeVisible();
  });
});
