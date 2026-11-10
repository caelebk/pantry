import { expect, test } from '@playwright/test';
import { installDesignBaseline } from './fixtures/design-baseline';

test.describe('Shopping List Workflow E2E', () => {
  test('should display the store-trip checklist with an in-cart tray', async ({ page }) => {
    await installDesignBaseline(page, 'light');
    await page.route('**/api/v1/shopping-list', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
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
              storeName: 'Costco',
              source: 'manual',
            },
            {
              id: 'sl-2',
              name: 'Whole Milk',
              category: 'Dairy',
              quantity: 1,
              unit: 'gal',
              checked: true,
              storeName: 'Costco',
              source: 'manual',
            },
          ],
        },
      });
    });

    await page.goto('/shopping-list');

    await expect(page.getByRole('heading', { name: 'Shopping list', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Shopping at')).toBeVisible();
    await expect(page.getByRole('link', { name: /Organic Eggs/ })).toBeVisible();
    await expect(page.getByLabel('Mark Organic Eggs as bought')).toBeVisible();
    await expect(page.getByText('1 in cart')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restock' })).toBeVisible();
  });
});
