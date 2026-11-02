import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { installDesignBaseline } from './fixtures/design-baseline';

const evidence = path.resolve(
  process.env['DESIGN_EVIDENCE_DIR'] ?? '../docs/design-evidence/S03-S07',
);
async function capture(page: import('@playwright/test').Page, name: string) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: path.join(evidence, `${name}.png`) });
}
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1280, 390, 320]) {
    test(`shared navigation and creation ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const fixture = await installDesignBaseline(page, theme);
      let posts = 0;
      let release: (() => void) | undefined;
      await page.route('**/api/v1/kitchens', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        posts++;
        if (posts === 1)
          return route.fulfill({ status: 503, json: { status: 'error', message: 'Unavailable' } });
        await new Promise<void>((resolve) => (release = resolve));
        const data = route.request().postDataJSON();
        await route.fulfill({
          json: {
            status: 'success',
            data: {
              id: 'new-kitchen',
              name: data.name,
              description: data.description,
              role: 'owner',
              memberCount: 1,
            },
          },
        });
      });
      await page.goto('/home');
      const drawer = page.locator('#pantry-navigation');
      const trigger = page.getByRole('button', { name: /Toggle Navigation Menu/i });
      if (width >= 768)
        await expect(drawer.getByRole('button', { name: 'Close navigation' })).not.toBeVisible();
      const kitchenTrigger = drawer.locator('button[aria-controls="pantry-kitchens"]');
      if (width < 768) {
        await expect(drawer).toHaveAttribute('inert', '');
        await trigger.focus();
        await page.keyboard.press('Tab');
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(false);
        await trigger.click();
        const close = drawer.getByRole('button', { name: 'Close navigation' });
        await expect(close).toBeFocused();
        expect((await close.boundingBox())?.width).toBe(42);
        await page.keyboard.press('Shift+Tab');
        await expect(drawer.getByRole('button', { name: /Log out|Logout/i })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await capture(page, `drawer-${width}-${theme}`);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(drawer).toHaveAttribute('aria-modal', 'true');
        await page
          .locator('pantry-sidebar > div[aria-hidden="true"]')
          .click({ position: { x: width - 10, y: 450 } });
        await expect(drawer).toHaveAttribute('inert', '');
        await expect(trigger).toBeFocused();
        await trigger.click();
      }
      if (width < 768) await expect(drawer).toHaveAttribute('aria-modal', 'true');
      await kitchenTrigger.focus();
      await page.keyboard.press('ArrowDown');
      const panel = page.locator('#pantry-kitchens');
      await expect(panel.locator('button').first()).toBeFocused();
      await page.keyboard.press('End');
      await expect(panel.locator('button').last()).toBeFocused();
      await page.keyboard.press('Home');
      await expect(panel.locator('button').first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(kitchenTrigger).toBeFocused();
      await kitchenTrigger.click();
      await panel.getByRole('button', { name: 'Create kitchen' }).click();
      const dialog = page.getByRole('dialog', { name: 'Create kitchen', exact: true });
      const name = dialog.getByRole('textbox', { name: 'Kitchen name' });
      await expect(name).toBeFocused();
      await dialog.getByRole('button', { name: 'Create kitchen', exact: true }).click();
      await expect(name).toHaveAttribute('aria-invalid', 'true');
      const describedBy = await name.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      await expect(page.locator(`[id="${describedBy}"]`)).toContainText('Enter a kitchen name');
      const longName = 'Weekend family kitchen for shared cooking and community celebrations';
      await name.fill(longName);
      await dialog
        .getByRole('textbox', { name: 'Description (optional)' })
        .fill('Details retained after a failed save');
      await dialog.getByRole('button', { name: 'Create kitchen', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('Try again');
      await expect(name).toHaveValue(longName);
      await capture(page, `creation-error-${width}-${theme}`);
      await dialog.getByRole('button', { name: 'Create kitchen', exact: true }).click();
      const pending = dialog.getByRole('button', { name: 'Creating kitchen…' });
      await expect(pending).toBeDisabled();
      await name.press('Enter');
      expect(posts).toBe(2);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
      release?.();
      await expect(dialog).not.toBeVisible();
      await expect(kitchenTrigger).toBeFocused();
      await expect(page.locator('pantry-toast-container [role="status"]')).toContainText(
        'Your new kitchen is ready',
      );
      const toast = page.locator('pantry-toast-container');
      expect(
        await toast.locator('.toast-stack').evaluate((el) => el.getBoundingClientRect().right),
      ).toBeLessThanOrEqual(width);
      if (width < 768) {
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await expect(drawer).toHaveAttribute('inert', '');
        await trigger.click();
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
        expect(await page.locator('main').evaluate((el) => !!el.closest('[inert]'))).toBe(false);
        await page.setViewportSize({ width, height: 900 });
        await expect(drawer).toHaveAttribute('inert', '');
      } else {
        await drawer.getByRole('button', { name: 'Collapse sidebar' }).click();
        await page.setViewportSize({ width: 390, height: 900 });
        await trigger.click();
        await expect(drawer.getByRole('link', { name: 'Recipes' })).toBeVisible();
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width, height: 900 });
      }
      expect(errors).toEqual([]);
      expect(fixture.unexpectedRequests).toEqual([]);
    });
  }
  test(`profile entry and recipe validation ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const fixture = await installDesignBaseline(page, theme);
    await page.route('**/api/v1/me/sessions', (route) =>
      route.fulfill({ json: { status: 'success', data: [] } }),
    );
    await page.goto('/profile');
    const opener = page.locator('[data-create-kitchen]');
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Create kitchen', exact: true });
    await expect(dialog.getByRole('textbox', { name: 'Kitchen name' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
    let profilePosts = 0;
    await page.route('**/api/v1/kitchens', (route) => {
      expect(route.request().method()).toBe('POST');
      profilePosts++;
      return route.fulfill({
        json: {
          status: 'success',
          data: {
            id: 'profile-created',
            name: 'Extended family kitchen for shared weekend cooking and celebrations',
            role: 'owner',
            memberCount: 1,
          },
        },
      });
    });
    await opener.click();
    await dialog
      .getByRole('textbox', { name: 'Kitchen name' })
      .fill('Extended family kitchen for shared weekend cooking and celebrations');
    await dialog.getByRole('button', { name: 'Create kitchen', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(profilePosts).toBe(1);
    await expect(page.locator('[data-select-kitchen][aria-pressed="true"]')).toContainText(
      'Extended family kitchen',
    );
    await capture(page, `profile-created-390-${theme}`);
    await page.goto('/recipes/new');
    await page
      .getByRole('button', { name: /Save recipe/i })
      .first()
      .click();
    const summary = page.locator('[data-validation-summary]');
    await expect(summary).toBeFocused();
    await summary.getByRole('button').first().click();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toMatch(/INPUT|TEXTAREA/);
    await capture(page, `recipe-validation-390-${theme}`);
    expect(fixture.unexpectedRequests).toEqual([]);
  });
  for (const routeName of ['items', 'ingredients']) {
    test(`pagination ${routeName} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      const fixture = await installDesignBaseline(page, theme);
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      const ingredients = Array.from({ length: 41 }, (_, i) => ({
        id: `ingredient-${i}`,
        name: `Ingredient ${String(i).padStart(2, '0')}`,
        ingredientGroupId: 1,
        defaultUnitId: 1,
      }));
      await page.route('**/api/v1/ingredients', (r) =>
        r.fulfill({ json: { status: 'success', data: ingredients } }),
      );
      await page.route('**/api/v1/ingredient-items', (r) =>
        r.fulfill({
          json: {
            status: 'success',
            data: ingredients.map((ing, i) => ({
              id: `item-${i}`,
              ingredientId: ing.id,
              label: ing.name,
              quantity: 200,
              unitId: 1,
              locationId: 1,
              purchaseDate: '2026-10-01',
              expirationDate: '2027-03-15',
            })),
          },
        }),
      );
      await page.goto(`/inventory/${routeName}${routeName === 'items' ? '?view=table' : ''}`);
      await page.waitForLoadState('networkidle');
      expect(pageErrors).toEqual([]);
      const pagination = page.locator('pantry-data-table-pagination');
      await expect(pagination.getByTestId('pagination-summary')).toContainText('Page 1 of 3');
      await pagination.getByRole('button', { name: /Next page/i }).click();
      await expect(pagination.getByTestId('pagination-summary')).toContainText('Page 2 of 3');
      await expect(pagination.locator('[aria-current="page"]')).toHaveText('2');
      await expect(pagination.getByRole('button', { name: /First page/i })).not.toBeVisible();
      await expect(pagination.getByTestId('page-number').filter({ visible: true })).toHaveCount(1);
      await pagination.scrollIntoViewIfNeeded();
      await capture(page, `pagination-${routeName}-320-${theme}`);
      const rect = await pagination.boundingBox();
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
      const search = page.locator('pantry-search-input input');
      await search.fill('Ingredient 40');
      await expect(pagination.getByTestId('pagination-summary')).toContainText('Page 1 of 1');
      await expect(pagination.getByRole('button', { name: /Next page/i })).toBeDisabled();
      expect(fixture.unexpectedRequests).toEqual([]);
    });
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`many memberships and dialog breakpoint ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    const fixture = await installDesignBaseline(page, theme);
    const names = Array.from(
      { length: 12 },
      (_, i) =>
        `Shared kitchen ${i + 1} for extended family weekend cooking and community celebrations`,
    );
    await page.route('**/api/v1/me/profile', (r) =>
      r.fulfill({
        json: {
          status: 'success',
          data: {
            user: {
              id: 'design-user',
              email: 'design-review@example.invalid',
              fullName: 'Alex Sample',
              globalRole: 'user',
              themePreference: theme,
              locale: 'en',
              primaryKitchenId: 'kitchen-0',
            },
            memberships: names.map((name, i) => ({
              id: `kitchen-${i}`,
              name,
              role: 'owner',
              memberCount: i + 1,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            })),
          },
        },
      }),
    );
    await page.goto('/home');
    const trigger = page.locator('#pantry-navigation button[aria-controls="pantry-kitchens"]');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const panel = page.locator('#pantry-kitchens');
    await expect(panel.locator('button[aria-pressed]')).toHaveCount(12);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-label', names[1]);
    await trigger.click();
    await expect(panel).toBeVisible();
    await capture(page, `memberships-1440-${theme}`);
    await panel.getByRole('button', { name: 'Create kitchen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create kitchen', exact: true });
    await expect(dialog.getByRole('textbox', { name: 'Kitchen name' })).toBeFocused();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(page.locator('#pantry-navigation')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle Navigation Menu' })).toBeFocused();
    await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('button[aria-pressed]')).toHaveCount(12);
    await capture(page, `memberships-320-${theme}`);
    const geometry = await panel.evaluate((el) => ({
      right: el.getBoundingClientRect().right,
      overflow: el.scrollWidth > el.clientWidth + 1,
    }));
    expect(geometry.right).toBeLessThanOrEqual(320);
    expect(geometry.overflow).toBe(false);
    expect(fixture.unexpectedRequests).toEqual([]);
  });
  test(`PrimeNG validation descriptions ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const fixture = await installDesignBaseline(page, theme);
    await page.goto('/recipes/new');
    await page.getByRole('button', { name: 'Save Recipe', exact: true }).first().click();
    const select = page.locator('p-select [role="combobox"][id^="ing-select-"]').first();
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    const description = await select.getAttribute('aria-describedby');
    expect(description).toBeTruthy();
    await expect(page.locator(`[id="${description}"]`)).not.toBeEmpty();
    await page
      .locator('[data-validation-summary]')
      .getByRole('button')
      .filter({ hasText: /ingredient/i })
      .first()
      .click();
    await expect(select).toBeFocused();
    await capture(page, `select-validation-320-${theme}`);
    expect(fixture.unexpectedRequests).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`long toast and persistent error ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const fixture = await installDesignBaseline(page, theme);
    const longName = 'Community pantry organic whole grain ingredient '.repeat(7) + 'x'.repeat(100);
    await page.route('**/api/v1/ingredients', (r) =>
      r.fulfill({
        json: {
          status: 'success',
          data: [{ id: 'long-ingredient', name: longName, ingredientGroupId: 1, defaultUnitId: 1 }],
        },
      }),
    );
    let removed = false;
    await page.route('**/api/v1/ingredients/long-ingredient', (r) => {
      expect(r.request().method()).toBe('DELETE');
      removed = true;
      return r.fulfill({ json: { status: 'success', data: null } });
    });
    await page.goto('/inventory/ingredients');
    await page.getByLabel(`Actions for ${longName}`, { exact: true }).click();
    await page.getByRole('button', { name: `Delete ingredient ${longName}`, exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Delete from inventory?' })
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    const toast = page.locator('pantry-toast-container [role="status"]');
    await expect(toast).toContainText(longName);
    expect(removed).toBe(true);
    const rect = await toast.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(320);
    expect(await toast.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await capture(page, `long-toast-320-${theme}`);
    await toast.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(toast).not.toBeVisible();
    await page.route('**/api/v1/recipes', (r) =>
      r.fulfill({ status: 503, json: { status: 'error', message: 'Unavailable' } }),
    );
    await page.goto('/recipes');
    const error = page.locator('pantry-toast-container [role="alert"]');
    await expect(error).toContainText('Unable to load recipe data');
    await page.clock.runFor(6000);
    await expect(error).toBeVisible();
    await error.getByRole('button', { name: 'Dismiss notification' }).focus();
    await page.keyboard.press('Enter');
    await expect(error).not.toBeVisible();
    expect(fixture.unexpectedRequests).toEqual([]);
  });
}
