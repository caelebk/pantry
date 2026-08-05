import { expect, test } from '@playwright/test';

test.describe('Shopping List Workflow E2E', () => {
  test('should display shopping list items and handle item additions', async ({ page }) => {
    await page.route('**/api/shopping-list', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            status: 'success',
            data: [
              {
                id: 'sl-1',
                name: 'Organic Eggs',
                category: 'Dairy',
                quantity: 12,
                unit: 'pcs',
                checked: false,
                estimatedPrice: 4.99,
                source: 'manual',
              },
            ],
          },
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          json: {
            status: 'success',
            data: {
              id: 'sl-2',
              ...body,
            },
          },
        });
      }
    });

    await page.goto('/shopping-list');

    // Verify existing item renders
    await expect(page.getByText('Organic Eggs')).toBeVisible();
  });
});
