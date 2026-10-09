import { expect, test, type Locator, type Page } from '@playwright/test';
import { installDesignBaseline } from './fixtures/design-baseline';

/** DOM bounds alone miss the Chromium pseudo-element compositing failure. */
async function expectGlyphPaintedInsideIcon(page: Page, icon: Locator) {
  await icon.scrollIntoViewIfNeeded();
  const bounds = await icon.boundingBox();
  expect(bounds, 'Icon has a visible layout box').not.toBeNull();
  await icon.evaluate((element) => element.setAttribute('data-icon-paint-probe', ''));
  const painted = await page.screenshot({ clip: bounds!, animations: 'disabled' });
  const hide = await page.addStyleTag({
    content: '[data-icon-paint-probe]::before { visibility: hidden !important; }',
  });
  const hidden = await page.screenshot({ clip: bounds!, animations: 'disabled' });
  await hide.evaluate((element) => element.remove());
  await icon.evaluate((element) => element.removeAttribute('data-icon-paint-probe'));
  const changedPixels = await page.evaluate(
    async ({ painted, hidden }) => {
      async function pixels(data: string) {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      }
      const [visiblePixels, hiddenPixels] = await Promise.all([pixels(painted), pixels(hidden)]);
      let changed = 0;
      for (let offset = 0; offset < visiblePixels.length; offset += 4) {
        const delta =
          Math.abs(visiblePixels[offset] - hiddenPixels[offset]) +
          Math.abs(visiblePixels[offset + 1] - hiddenPixels[offset + 1]) +
          Math.abs(visiblePixels[offset + 2] - hiddenPixels[offset + 2]);
        if (delta > 30) changed++;
      }
      return changed;
    },
    { painted: painted.toString('base64'), hidden: hidden.toString('base64') },
  );
  expect(
    changedPixels,
    'The glyph must paint inside its own icon box, not float elsewhere',
  ).toBeGreaterThan(8);
}

for (const theme of ['light', 'dark'] as const) {
  for (const target of [
    {
      name: 'Home primary action',
      route: '/home',
      heading: 'Weekend Kitchen',
      selectors: ['main .page-header .pi-plus'],
    },
    {
      name: 'Ingredient Items view toggle',
      route: '/inventory/items',
      heading: 'Ingredient Items',
      selectors: [
        'main button .pi-list',
        'main button .pi-th-large',
        'pantry-data-table-pagination .pi-angle-double-left',
        'pantry-data-table-pagination .pi-angle-right',
      ],
    },
    {
      name: 'Add Item navigation',
      route: '/inventory/items/new?ingredientId=ingredient-rice',
      heading: 'Add Ingredient Item',
      selectors: ['main .pi-arrow-left'],
    },
  ]) {
    test(`${target.name} icon glyph paints within its control in ${theme} theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const fixture = await installDesignBaseline(page, theme);
      await page.goto(target.route);
      await expect(page.getByRole('heading', { name: target.heading, exact: true })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      for (const selector of target.selectors) {
        await test.step(`Verify glyph paint for ${selector}`, async () => {
          await expectGlyphPaintedInsideIcon(page, page.locator(selector).first());
        });
      }
      expect(fixture.unexpectedRequests).toEqual([]);
    });
  }
}
