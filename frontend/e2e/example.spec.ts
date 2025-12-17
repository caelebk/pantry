import { expect, test } from '@playwright/test';

test.describe('Inventory Page', () => {
  test('should display a list of items from mocked API', async ({ page }) => {
    // Mock Units API
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: 1, name: 'pcs', type: 'Count', toBaseFactor: 1 },
            { id: 2, name: 'kg', type: 'Weight', toBaseFactor: 1000 },
          ],
        },
      });
    });

    // Mock Locations API
    await page.route('**/api/locations', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: 1, name: 'Pantry' },
            { id: 2, name: 'Fridge' },
          ],
        },
      });
    });

    // Mock Items API
    await page.route('**/api/items', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            {
              id: 'item-1',
              ingredientId: 'ing-1',
              label: 'Playwright Test Apple',
              quantity: 5,
              unitId: 1,
              locationId: 2,
              expirationDate: '2025-12-31',
              purchaseDate: '2025-01-01',
            },
            {
              id: 'item-2',
              ingredientId: 'ing-2',
              label: 'Playwright Test Bread',
              quantity: 1,
              unitId: 1,
              locationId: 1,
              expirationDate: '2024-12-31',
              purchaseDate: '2024-12-01',
            },
          ],
        },
      });
    });

    // Navigate to the inventory page
    await page.goto('/inventory');

    // Verify that the mocked items are displayed
    // The component likely uses the 'name' property of Item, which is mapped from 'label' in ItemDTO
    await expect(page.getByText('Playwright Test Apple')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Playwright Test Bread')).toBeVisible();
  });
});
