import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = path.resolve('../docs/design-evidence/inventory-overview-summary');

test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
});

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320] as const) {
    test(`inventory overview populated ${width}px ${theme}`, async ({ page }) => {
      test.setTimeout(60_000);
      const height = width >= 1280 ? 900 : 844;
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installDesignBaseline(page, theme);

      await page.goto('/inventory');
      await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
      await expect(page.locator('pantry-spinner')).toHaveCount(0);

      // Verify the overview header contains only the page title
      const header = page.locator('header.page-header');
      await expect(header.getByRole('heading', { level: 1 })).toHaveText('Inventory');
      await expect(header.locator('a[routerLink="/inventory/items/new"]')).toHaveCount(0);

      // Verify guide
      const guide = page.locator('section[aria-labelledby="inventory-guide"]');
      await expect(guide).toBeVisible();
      const details = guide.locator('details');
      await expect(details).toBeVisible();
      expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(false);

      const attention = page.locator('section[aria-labelledby="inventory-attention"]');
      await expect(attention).toBeVisible();
      const order = await page.evaluate(() => {
        const attention = document.querySelector('#inventory-attention')!;
        const explore = document.querySelector('#inventory-explore')!;
        const guide = document.querySelector('#inventory-guide')!;
        return (
          Boolean(guide.compareDocumentPosition(attention) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          Boolean(attention.compareDocumentPosition(explore) & Node.DOCUMENT_POSITION_FOLLOWING)
        );
      });
      expect(order).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );

      // Verify 3 navigation rows
      const nav = page.locator('nav[aria-label="Inventory pages"]');
      await expect(nav.locator('> a')).toHaveCount(3);

      await page.screenshot({
        path: path.join(evidence, `overview-populated-${width}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  for (const width of [1440, 390] as const) {
    test(`inventory overview empty stock ${width}px ${theme}`, async ({ page }) => {
      test.setTimeout(60_000);
      const height = width >= 1280 ? 900 : 844;
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installDesignBaseline(page, theme);

      // Override items to return empty array
      await page.route('**/api/v1/ingredient-items', async (route) => {
        await route.fulfill({ json: { status: 'success', data: [] } });
      });

      await page.goto('/inventory');
      await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
      await expect(page.locator('pantry-spinner')).toHaveCount(0);
      await expect(page.locator('pantry-empty-state')).toBeVisible();
      await expect(
        page.locator('pantry-empty-state').getByRole('link', { name: 'Add Ingredient Item' }),
      ).toBeVisible();

      await page.screenshot({
        path: path.join(evidence, `overview-empty-${width}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });

    test(`inventory overview partial failure ${width}px ${theme}`, async ({ page }) => {
      test.setTimeout(60_000);
      const height = width >= 1280 ? 900 : 844;
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installDesignBaseline(page, theme);

      // Override items to return failure
      await page.route('**/api/v1/ingredient-items', async (route) => {
        await route.fulfill({
          status: 500,
          json: { status: 'error', message: 'Failed to fetch stock' },
        });
      });

      await page.goto('/inventory');
      await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();

      await expect(page.getByText(/Stock summary unavailable/)).toBeVisible();
      await expect(page.locator('pantry-empty-state')).toHaveCount(0);

      // Guide and navigation remain visible
      await expect(page.locator('section[aria-labelledby="inventory-guide"]')).toBeVisible();
      await expect(page.locator('nav[aria-label="Inventory pages"]')).toBeVisible();

      await page.screenshot({
        path: path.join(evidence, `overview-partial-failure-${width}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test(`inventory overview disclosure toggle and keyboard navigation ${theme}`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installDesignBaseline(page, theme);

    await page.goto('/inventory');
    const summary = page.locator('summary:has-text("Explain these terms")');
    const details = page.locator('section[aria-labelledby="inventory-guide"] details');
    await expect(details).toBeVisible();
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(false);

    // Toggle by click
    await summary.click();
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(true);
    await expect(details.locator('dl dt')).toHaveCount(4);
    await page.screenshot({
      path: path.join(evidence, `overview-disclosure-open-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    // Toggle by Enter key
    await summary.focus();
    await page.keyboard.press('Enter');
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(false);

    // Toggle by Space key
    await page.keyboard.press('Space');
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(true);
  });
}

test('attention filters retain their stock-list routing', async ({ page }) => {
  await installDesignBaseline(page, 'light');
  await page.goto('/inventory');
  const attention = page.locator('section[aria-labelledby="inventory-attention"]');
  await attention.locator('a[href*="status=expired"]').click();
  await expect(page).toHaveURL(/\/inventory\/items\?status=expired$/);
  await page.goto('/inventory');
  await attention.locator('a[href*="status=expiring"]').click();
  await expect(page).toHaveURL(/\/inventory\/items\?status=expiring$/);
});

test('long attention labels reflow on a narrow screen without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await installDesignBaseline(page, 'light');
  const label = 'Organic whole grain brown basmati rice from the weekend farmers market';
  await page.route('**/api/v1/ingredient-items', async (route) => {
    await route.fulfill({
      json: {
        status: 'success',
        data: [
          {
            id: 'item-long',
            ingredientId: 'ingredient-rice',
            label,
            quantity: 1250,
            unitId: 1,
            locationId: 1,
            purchaseDate: '2026-10-01',
            expirationDate: '2026-10-06',
            notes: '',
          },
        ],
      },
    });
  });
  await page.goto('/inventory');
  const row = page.locator('section[aria-labelledby="inventory-attention"] a[href*="/edit"]');
  await expect(row).toContainText(label);
  await expect(row).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await row.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({
    path: path.join(evidence, 'overview-long-label-320-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
