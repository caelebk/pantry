import { expect, test, type Locator } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  fixtureVersion,
  installDesignBaseline,
  kitchenName,
  longIngredientName,
  type BaselineTheme,
} from './fixtures/design-baseline';

// Observation mode records the pre-change geometry; normal mode enforces the S01 contract.
const observeBefore = process.env['DESIGN_GEOMETRY_BASELINE'] === '1';
const evidenceDirectory = path.resolve(
  process.cwd(),
  process.env['DESIGN_EVIDENCE_DIR'] ?? '../docs/design-evidence/S01/after',
);
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 844 },
];
const pilots = [
  { name: 'home', route: '/home', heading: kitchenName, host: 'pantry-home' },
  {
    name: 'ingredient-items',
    route: '/inventory/items',
    heading: 'Ingredient Items',
    host: 'pantry-inventory',
  },
  {
    name: 'add-ingredient',
    route: '/inventory/ingredients/new',
    heading: 'Add Ingredient',
    host: 'pantry-add-ingredient-page',
  },
];

async function computedTypography(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      fontFamily: style.fontFamily,
      fontSize: parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      lineHeight: parseFloat(style.lineHeight),
      textTransform: style.textTransform,
      height: rect.height,
      width: rect.width,
      radius: parseFloat(style.borderTopLeftRadius),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
}

// A real profile response drives this variation; it is not a patched screenshot label.
for (const viewport of viewports.filter((viewport) => viewport.width <= 390)) {
  for (const theme of ['light', 'dark'] as BaselineTheme[]) {
    test(`home long kitchen name ${viewport.name} ${theme} geometry`, async ({ page }) => {
      const longKitchenName = 'Alex and Morgan’s Weekend Cooking Kitchen';
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const fixture = await installDesignBaseline(page, theme, { kitchenName: longKitchenName });
      await page.goto('/home');
      const title = page
        .getByRole('heading', { name: longKitchenName, exact: true })
        .and(page.locator('.type-page-title'));
      await expect(title).toBeVisible();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect.poll(() => fixture.servedRequests).toContain('GET /api/v1/recipes/available');
      await expect
        .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
        .toBe(theme === 'dark');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const typography = await computedTypography(title);
      const bounds = await page.locator('pantry-home > div').evaluate((root) => {
        const box = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
          };
        };
        const header = root.firstElementChild!;
        const title = root.querySelector('.type-page-title')!;
        return {
          page: box(root),
          title: box(title),
          actions: Array.from(header.querySelectorAll('button')).map(box),
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          headingClientWidth: title.clientWidth,
          headingScrollWidth: title.scrollWidth,
        };
      });
      await mkdir(evidenceDirectory, { recursive: true });
      const filename = `home-long-kitchen-${viewport.name}-${theme}`;
      await page.screenshot({
        path: path.join(evidenceDirectory, `${filename}.png`),
        animations: 'disabled',
      });
      await writeFile(
        path.join(evidenceDirectory, `${filename}.json`),
        JSON.stringify(
          {
            route: '/home',
            viewport,
            theme,
            fixture: fixtureVersion,
            kitchenName: longKitchenName,
            revision,
            capturedAt: new Date().toISOString(),
            platform: process.platform,
            browser: page.context().browser()?.version(),
            bounds,
            typography,
            observations: { ...fixture, errors },
            captureLimit:
              'Current viewport of the fixed-height shell; lower content is outside this header regression.',
          },
          null,
          2,
        ) + '\n',
      );
      expect(typography.fontFamily).toContain('system-ui');
      expect(typography.fontWeight).toBe('600');
      expect(bounds.title.height, 'Long kitchen title wraps naturally').toBeGreaterThan(
        typography.lineHeight * 1.5,
      );
      expect(bounds.headingScrollWidth).toBeLessThanOrEqual(bounds.headingClientWidth + 1);
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
      expect(bounds.title.x).toBeGreaterThanOrEqual(bounds.page.x - 1);
      expect(bounds.title.right).toBeLessThanOrEqual(bounds.page.right + 1);
      for (const action of bounds.actions) {
        expect(action.x).toBeGreaterThanOrEqual(bounds.page.x - 1);
        expect(action.right).toBeLessThanOrEqual(bounds.page.right + 1);
        expect(
          action.y,
          'Header actions stay below the wrapped mobile title',
        ).toBeGreaterThanOrEqual(bounds.title.bottom - 1);
      }
      expect(fixture.unexpectedRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as BaselineTheme[]) {
    for (const pilot of pilots) {
      test(`${pilot.name} ${viewport.name} ${theme} geometry and typography`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        const fixture = await installDesignBaseline(page, theme);
        await page.goto(pilot.route);
        const title = page
          .getByRole('heading', { name: pilot.heading, exact: true })
          .and(page.locator('.type-page-title'));
        await expect(title).toBeVisible();
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        await expect
          .poll(() => page.locator('html').evaluate((root) => root.classList.contains('dark')))
          .toBe(theme === 'dark');
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        const filename = `${pilot.name}-${viewport.name}-${theme}`;
        await mkdir(evidenceDirectory, { recursive: true });
        const roles: Record<string, Awaited<ReturnType<typeof computedTypography>>> = {};
        const geometry = await page.locator(`${pilot.host} .page-layout`).evaluate((root) => {
          const box = (element: Element | null) => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              right: rect.right,
              bottom: rect.bottom,
            };
          };
          const main = document.querySelector('main')!;
          const breadcrumb = document.querySelector('pantry-breadcrumbs nav');
          const title = root.querySelector('.type-page-title');
          const firstCard = root.querySelector('.glass-card');
          const table = root.querySelector('table');
          const statuses = ['All stock', 'Fresh', 'Expiring soon', 'Expired', 'Out of stock'];
          const buttons = Array.from(root.querySelectorAll('button')).filter(
            (button) => button.getBoundingClientRect().width > 0,
          );
          return {
            main: box(main),
            breadcrumb: box(breadcrumb),
            title: box(title),
            page: box(root),
            card: box(firstCard),
            tableContainer: box(table?.closest('.glass-card') ?? null),
            searchInput: box(root.querySelector('pantry-search-input input')),
            header: box(root.firstElementChild),
            headerButtons: Array.from(root.firstElementChild?.querySelectorAll('button') ?? []).map(
              box,
            ),
            statusButtons: buttons
              .filter((button) => statuses.includes(button.textContent?.trim() ?? ''))
              .map((button) => ({ text: button.textContent?.trim(), ...box(button)! })),
            scrollWidth: root.scrollWidth,
            clientWidth: root.clientWidth,
            mainScrollWidth: main.scrollWidth,
            mainClientWidth: main.clientWidth,
            viewportWidth: innerWidth,
          };
        });
        let overlay: unknown = null;
        let fieldLabel: unknown = null;
        const footerActions: unknown[] = [];
        try {
          const titleStyle = await computedTypography(title);
          roles['page-title'] = titleStyle;
          expect(titleStyle.fontFamily).toContain('system-ui');
          expect(titleStyle.fontWeight).toBe('600');
          expect(titleStyle.fontSize).toBeGreaterThanOrEqual(24);
          expect(titleStyle.fontSize).toBeLessThanOrEqual(30);
          if (pilot.name === 'home') {
            const specifications = [
              { role: 'section-title', size: 18, weight: '600' },
              { role: 'label', size: 13, weight: '500' },
              { role: 'meta', size: 12, weight: '400' },
            ];
            for (const specification of specifications) {
              const locator = page
                .locator(`.type-${specification.role}`)
                .filter({ visible: true })
                .first();
              roles[specification.role] = await computedTypography(locator);
              expect(roles[specification.role].fontFamily).toBe(titleStyle.fontFamily);
              expect(roles[specification.role].fontSize).toBe(specification.size);
              expect(roles[specification.role].fontWeight).toBe(specification.weight);
              expect(roles[specification.role].textTransform).toBe('none');
            }
          }
          if (pilot.name === 'add-ingredient') {
            const input = page.locator('#ingredient-name');
            await input.fill(longIngredientName);
            await expect(input).toHaveValue(longIngredientName);
            const group = page.locator('#ingredient-group');
            const groupControl = page.locator('p-select').filter({ has: group });
            roles['input'] = await computedTypography(input);
            roles['select-control'] = await computedTypography(groupControl);
            for (const control of [roles['input'], roles['select-control']]) {
              expect(control.height).toBeCloseTo(42, 0);
              expect(control.radius).toBeCloseTo(12, 0);
              expect(control.fontFamily).toBe(titleStyle.fontFamily);
            }
            const label = page.locator('label[for="ingredient-group"]');
            roles['field-label'] = await computedTypography(label);
            fieldLabel = await label.evaluate((element) => ({
              text: element.textContent?.trim(),
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              bounds: element.getBoundingClientRect().toJSON(),
            }));
            expect(
              await label.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
              'Long field label wraps without clipping',
            ).toBe(true);
            expect(roles['field-label'].fontSize).toBe(13);
            expect(roles['field-label'].fontWeight).toBe('500');
            await group.focus();
            await expect(group).toBeFocused();
            const focused = await computedTypography(groupControl);
            expect(
              (focused.outlineStyle !== 'none' && parseFloat(focused.outlineWidth) > 0) ||
                focused.boxShadow !== roles['select-control'].boxShadow,
              'Focused select needs a visible outline or shadow',
            ).toBe(true);
            await group.press('ArrowDown');
            const panel = page.locator('.p-select-overlay').filter({ visible: true });
            await expect(panel).toBeVisible();
            await expect(
              panel.getByRole('option', { name: 'Vegetables', exact: true }),
            ).toBeVisible();
            roles['select-overlay'] = await computedTypography(panel);
            expect(roles['select-overlay'].fontFamily).toBe(titleStyle.fontFamily);
            overlay = await panel.boundingBox();
            const overlayBox = await panel.boundingBox();
            expect(overlayBox!.x).toBeGreaterThanOrEqual(-1);
            expect(overlayBox!.x + overlayBox!.width).toBeLessThanOrEqual(viewport.width + 1);
            expect(overlayBox!.y + overlayBox!.height).toBeLessThanOrEqual(viewport.height + 1);
            await page.screenshot({
              path: path.join(evidenceDirectory, `${filename}-select-overlay.png`),
              animations: 'disabled',
            });
            await page.keyboard.press('Escape');
            await expect(panel).toHaveCount(0);
            await expect(group).toBeFocused();
            await page.locator('main').evaluate((main) => {
              let node: HTMLElement | null = main.parentElement;
              while (node) {
                if (node.scrollHeight > node.clientHeight) node.scrollTop = 0;
                node = node.parentElement;
              }
            });
          }
          await page.screenshot({
            path: path.join(evidenceDirectory, `${filename}.png`),
            animations: 'disabled',
          });
          if (pilot.name === 'add-ingredient') {
            for (const name of ['Cancel', 'Create Ingredient']) {
              const action = page.locator('form').getByRole('button', { name, exact: true });
              await action.scrollIntoViewIfNeeded();
              const measured = await action.evaluate((button) => {
                const rect = button.getBoundingClientRect();
                const label =
                  Array.from(button.querySelectorAll('span')).find(
                    (span) => span.textContent?.trim() === button.textContent?.trim(),
                  ) ?? button;
                const range = document.createRange();
                range.selectNodeContents(label);
                const lines = Array.from(range.getClientRects()).filter(
                  (line) => line.height > 0 && line.width > 0,
                );
                return {
                  text: button.textContent?.trim(),
                  x: rect.x,
                  right: rect.right,
                  height: rect.height,
                  clientWidth: button.clientWidth,
                  scrollWidth: button.scrollWidth,
                  lineCount: new Set(lines.map((line) => Math.round(line.y))).size,
                };
              });
              footerActions.push(measured);
              if (!observeBefore) {
                expect(measured.x).toBeGreaterThanOrEqual(geometry.card!.x - 1);
                expect(measured.right).toBeLessThanOrEqual(geometry.card!.right + 1);
                expect(measured.height).toBeCloseTo(42, 0);
                expect(measured.scrollWidth).toBeLessThanOrEqual(measured.clientWidth + 1);
                expect(measured.lineCount, `${name} label should fit on one line`).toBe(1);
              }
            }
            await page.screenshot({
              path: path.join(evidenceDirectory, `${filename}-footer.png`),
              animations: 'disabled',
            });
          }
          expect(fixture.unexpectedRequests).toEqual([]);
          expect(errors).toEqual([]);
          if (!observeBefore) {
            expect(geometry.breadcrumb).not.toBeNull();
            if (pilot.name === 'add-ingredient' && viewport.width >= 768) {
              const main = await page.locator('main').boundingBox();
              expect(
                Math.abs(geometry.page!.x + geometry.page!.width / 2 - (main!.x + main!.width / 2)),
              ).toBeLessThanOrEqual(2);
            } else {
              expect(Math.abs(geometry.title!.x - geometry.breadcrumb!.x)).toBeLessThanOrEqual(2);
              expect(geometry.page!.x).toBeCloseTo(geometry.breadcrumb!.x, 0);
            }
            expect(
              geometry.scrollWidth,
              'Page must not spill into the shell horizontally',
            ).toBeLessThanOrEqual(geometry.clientWidth + 1);
            expect(geometry.mainScrollWidth).toBeLessThanOrEqual(geometry.mainClientWidth + 1);
            if (pilot.name === 'add-ingredient') {
              expect(geometry.page!.width).toBeLessThanOrEqual(640);
              expect(Math.abs(geometry.card!.x - geometry.breadcrumb!.x)).toBeLessThanOrEqual(2);
            }
            if (pilot.name === 'ingredient-items') {
              expect(geometry.searchInput).not.toBeNull();
              if (viewport.width >= 1280) {
                expect(
                  geometry.searchInput!.width,
                  'Desktop/laptop search retains a useful typing width',
                ).toBeGreaterThanOrEqual(239);
              }
              expect(geometry.searchInput!.x).toBeGreaterThanOrEqual(geometry.page!.x - 1);
              expect(geometry.searchInput!.right).toBeLessThanOrEqual(geometry.page!.right + 1);
              expect(
                Math.abs(geometry.tableContainer!.width - geometry.breadcrumb!.width),
                'Table uses shell workspace width',
              ).toBeLessThanOrEqual(2);
              for (const button of geometry.statusButtons) {
                expect(button.x).toBeGreaterThanOrEqual(geometry.page!.x - 1);
                expect(button.right).toBeLessThanOrEqual(geometry.page!.right + 1);
                expect(button.height).toBeGreaterThanOrEqual(41);
              }
              if (viewport.width <= 390) {
                for (const name of ['Fresh', 'Expiring soon', 'Expired']) {
                  await page.getByRole('button', { name, exact: true }).click();
                  await expect(page.locator('pantry-inventory table tbody tr')).toHaveCount(1);
                }
                await page.getByRole('button', { name: 'Out of stock', exact: true }).click();
                await expect(
                  page.getByRole('heading', { name: 'No matching stock', exact: true }),
                ).toBeVisible();
                await page.getByRole('button', { name: 'All stock', exact: true }).click();
                await expect(page.locator('pantry-inventory table tbody tr')).toHaveCount(3);
              }
            }
            for (const button of geometry.headerButtons) {
              expect(button!.x).toBeGreaterThanOrEqual(geometry.page!.x - 1);
              expect(button!.right).toBeLessThanOrEqual(geometry.page!.right + 1);
              const separated =
                button!.x >= geometry.title!.right - 1 || button!.y >= geometry.title!.bottom - 1;
              expect(separated, 'Header actions must not overlap the title').toBe(true);
            }
          }
        } finally {
          await writeFile(
            path.join(evidenceDirectory, `${filename}.json`),
            JSON.stringify(
              {
                route: pilot.route,
                viewport,
                theme,
                fixture: fixtureVersion,
                revision,
                capturedAt: new Date().toISOString(),
                platform: process.platform,
                browser: page.context().browser()?.version(),
                mode: observeBefore ? 'before-observation' : 'geometry-regression',
                geometry,
                roles,
                fieldLabel,
                overlay,
                footerActions,
                unexpectedRequests: fixture.unexpectedRequests,
                errors,
                reviewStatus:
                  'Requires human screenshot inspection; Windows/platform coverage not established',
                captureLimit:
                  'Viewport screenshots show the fixed-height shell. Content below its inner scroll viewport needs separate inspection.',
              },
              null,
              2,
            ) + '\n',
          );
        }
      });
    }
  }
}
