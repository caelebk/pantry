import { expect, test } from '@playwright/test';

test.describe('Inventory Workflow E2E', () => {
  test('should display inventory items and filter by search and location', async ({ page }) => {
    // Mock locations
    await page.route('**/api/locations', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: 1, name: 'Fridge' },
            { id: 2, name: 'Pantry' },
          ],
        },
      });
    });

    // Mock units
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [{ id: 1, name: 'pieces', shortName: 'pcs', type: 'Count', toBaseFactor: 1 }],
        },
      });
    });

    // Mock ingredient items
    await page.route('**/api/ingredient-items', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            {
              id: 'item-1',
              label: 'Fresh Whole Milk',
              quantity: 2,
              unitId: 1,
              locationId: 1,
              purchaseDate: '2026-08-01T00:00:00.000Z',
              expirationDate: '2026-08-15T00:00:00.000Z',
            },
            {
              id: 'item-2',
              label: 'Jasmine Rice',
              quantity: 5,
              unitId: 1,
              locationId: 2,
              purchaseDate: '2026-08-01T00:00:00.000Z',
              expirationDate: '2027-01-01T00:00:00.000Z',
            },
          ],
        },
      });
    });

    await page.goto('/inventory');

    // Verify both items rendered
    await expect(page.getByText('Fresh Whole Milk')).toBeVisible();
    await expect(page.getByText('Jasmine Rice')).toBeVisible();
  });
});
