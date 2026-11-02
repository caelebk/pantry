import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';
const evidence = path.resolve('../docs/design-evidence/H01');
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    test(`Home composition ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const fixtures = await installDesignBaseline(page, theme);
      await page.route('**/api/v1/recipes/recipe-rice', (route) =>
        route.fulfill({
          json: {
            status: 'success',
            data: {
              id: 'recipe-rice',
              name: 'Tomato and brown rice bowl',
              ingredients: [],
              steps: [],
            },
          },
        }),
      );
      await page.goto('/home');
      const home = page.locator('pantry-home');
      await expect(
        home.getByRole('heading', { name: 'Expired stock: 1', exact: true }),
      ).toBeVisible();
      await expect(home.locator('.page-header a[href="/inventory/items"]')).toHaveCount(0);
      const stock = home.locator('pantry-items-container').first();
      const recipe = home.locator('pantry-cookable-recipes-container a[href^="/recipes/"]').first();
      await expect(recipe).toHaveAttribute('href', '/recipes/recipe-rice');
      const order = await home.evaluate((el) => {
        const stock = el.querySelector('pantry-items-container')!;
        const recipe = el.querySelector('pantry-cookable-recipes-container')!;
        return !!(stock.compareDocumentPosition(recipe) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(order).toBe(true);
      for (const button of await stock.locator('button, a').all()) {
        await expect(button).toBeVisible();
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(41.99);
        expect(box?.height).toBeGreaterThanOrEqual(41.99);
        await expect(button).toHaveAttribute('aria-label', /Baby spinach/);
      }
      await home.getByRole('button', { name: 'Review expired items', exact: true }).click();
      await expect(home.locator('#expired-items-section')).toBeFocused();
      await expect(home.locator('#expired-items-section')).toHaveCSS('outline-style', 'solid');
      await recipe.focus();
      await expect(recipe).toBeFocused();
      await mkdir(evidence, { recursive: true });
      await page.locator('main').evaluate((el) => {
        el.parentElement!.scrollTop = 0;
      });
      await page.screenshot({ path: path.join(evidence, `populated-${width}-${theme}.png`) });
      await home.locator('pantry-location-overview-container').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(evidence, `lower-${width}-${theme}.png`) });
      const overflow = await home.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(overflow).toBe(false);
      await recipe.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/recipes\/recipe-rice$/);
      expect(fixtures.unexpectedRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
  for (const state of ['empty', 'error', 'all-clear'] as const) {
    test(`Home ${state} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const fixtures = await installDesignBaseline(page, theme);
      let fail = state === 'error';
      await page.route('**/api/v1/ingredient-items', async (route) => {
        if (fail)
          return route.fulfill({
            status: 503,
            json: { status: 'error', message: 'Synthetic outage' },
          });
        if (state === 'all-clear')
          return route.fulfill({
            json: {
              status: 'success',
              data: [
                {
                  id: 'fresh',
                  label: 'Brown rice',
                  quantity: 1,
                  unitId: 1,
                  locationId: 1,
                  purchaseDate: '2026-10-01',
                  expirationDate: '2027-01-01',
                },
              ],
            },
          });
        return route.fulfill({ json: { status: 'success', data: [] } });
      });
      await page.goto('/home');
      const home = page.locator('pantry-home');
      await mkdir(evidence, { recursive: true });
      if (state === 'error') {
        await expect(home.getByText('Your kitchen could not be loaded')).toBeVisible();
        await expect(home.locator('pantry-cookable-recipes-container')).toHaveCount(0);
        await page.screenshot({ path: path.join(evidence, `${state}-${theme}.png`) });
        fail = false;
        await home.getByRole('button', { name: 'Try again', exact: true }).click();
        await expect(home.getByText('Start with your ingredients')).toBeVisible();
      } else if (state === 'empty') {
        await expect(home.getByText('Start with your ingredients')).toBeVisible();
        await expect(home.locator('pantry-items-container')).toHaveCount(0);
        await page.screenshot({ path: path.join(evidence, `${state}-${theme}.png`) });
        await home.getByRole('button', { name: 'Add ingredient item', exact: true }).last().click();
        await expect(page).toHaveURL(/\/inventory\/items\/new$/);
      } else {
        await expect(home.getByText('Stock is up to date')).toBeVisible();
        await expect(home.locator('pantry-items-container')).toHaveCount(0);
        await page.screenshot({ path: path.join(evidence, `${state}-${theme}.png`) });
      }
      expect(fixtures.unexpectedRequests).toEqual([]);
    });
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`Home stock removal ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installDesignBaseline(page, theme);
    let attempts = 0;
    let removed = false;
    await page.route('**/api/v1/ingredient-items/item-spinach', async (route) => {
      expect(route.request().method()).toBe('DELETE');
      attempts++;
      if (attempts === 1)
        return route.fulfill({
          status: 503,
          json: { status: 'error', message: 'Synthetic removal failure' },
        });
      removed = true;
      return route.fulfill({ json: { status: 'success', data: true } });
    });
    await page.route('**/api/v1/ingredient-items', async (route) => {
      if (!removed) return route.fallback();
      return route.fulfill({ json: { status: 'success', data: [] } });
    });
    await page.goto('/home');
    const remove = page.getByRole('button', { name: 'Remove Baby spinach', exact: true });
    await expect(remove).toBeVisible();
    page.once('dialog', (dialog) => dialog.dismiss());
    await remove.click();
    expect(attempts).toBe(0);
    page.once('dialog', (dialog) => dialog.accept());
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Failed to remove item.', { exact: true })).toBeVisible();
    await expect(remove).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await remove.click();
    await expect(
      page.locator('pantry-home').getByText('Start with your ingredients'),
    ).toBeVisible();
    expect(attempts).toBe(2);
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 320]) {
    test(`Home long stock names ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installDesignBaseline(page, theme);
      const longName =
        'Organic baby spinach for the weekend cooking kitchen and a very long ingredient item name';
      await page.route('**/api/v1/ingredient-items', (route) =>
        route.fulfill({
          json: {
            status: 'success',
            data: Array.from({ length: 5 }, (_, i) => ({
              id: `expired-${i}`,
              label: `${longName} ${i}`,
              quantity: 200,
              unitId: 1,
              locationId: 2,
              purchaseDate: '2026-09-28',
              expirationDate: '2026-10-02',
            })),
          },
        }),
      );
      await page.goto('/home');
      const stock = page.locator('pantry-items-container').first();
      await expect(
        stock.getByRole('heading', { name: `${longName} 0`, exact: true }),
      ).toBeVisible();
      await expect(stock.getByRole('heading', { name: `${longName} 4`, exact: true })).toHaveCount(
        0,
      );
      const footer = stock.getByRole('link', { name: /View inventory/ });
      await expect(footer).toHaveAttribute('href', '/inventory/items');
      expect(await stock.evaluate((el) => el.scrollWidth > el.clientWidth + 1)).toBe(false);
      await page.screenshot({ path: path.join(evidence, `long-names-${width}-${theme}.png`) });
    });
  }
}
