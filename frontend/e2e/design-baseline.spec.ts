import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type BaselineTheme,
  fixtureNow,
  fixtureVersion,
  installDesignBaseline,
  kitchenName,
  longIngredientName,
} from './fixtures/design-baseline';

// Run from frontend: npx playwright test e2e/design-baseline.spec.ts --workers=1
// Captures are evidence for human review, not pixel assertions or visual acceptance.
const evidenceDirectory = path.resolve(
  process.cwd(),
  process.env['DESIGN_EVIDENCE_DIR'] ?? '../docs/design-evidence/E03',
);
const geometryPilots = process.env['DESIGN_CAPTURE_GEOMETRY'] === '1';
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const trackedDiff = execFileSync('git', ['diff', 'HEAD'], { encoding: 'utf8' });
const workingTreeDirty =
  execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).length > 0;
const sourceFiles = execFileSync(
  'git',
  [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
    'src',
    'public',
    'e2e',
    'angular.json',
    'package.json',
    'package-lock.json',
  ],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
  .sort();
const sourceTreeHash = createHash('sha256');
for (const filename of sourceFiles) {
  sourceTreeHash.update(filename).update('\0').update(readFileSync(filename)).update('\0');
}
const sourceTreeSha256 = sourceTreeHash.digest('hex');
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  ...(geometryPilots ? [{ name: 'laptop', width: 1280, height: 900 }] : []),
  { name: 'mobile', width: 390, height: 844 },
  ...(geometryPilots ? [{ name: 'narrow', width: 320, height: 844 }] : []),
];
const pages = [
  {
    name: 'home',
    route: '/home',
    heading: kitchenName,
    content: 'Tomato and brown rice bowl',
    endpoint: 'GET /api/v1/recipes/available',
    state: 'populated kitchen with expired, soon and fresh stock',
  },
  {
    name: 'ingredient-items',
    route: '/inventory/items',
    heading: 'Ingredient Items',
    content: longIngredientName,
    endpoint: 'GET /api/v1/ingredient-items',
    state: 'populated default list',
  },
  {
    name: 'add-item',
    route: '/inventory/items/new?ingredientId=ingredient-rice',
    heading: 'Add New Ingredient Item',
    content: longIngredientName,
    endpoint: 'GET /api/v1/ingredients',
    state: 'new form with long ingredient preselected; no submission',
  },
  {
    name: 'add-ingredient',
    route: '/inventory/ingredients/new',
    heading: 'Add Ingredient',
    content: longIngredientName,
    endpoint: 'GET /api/v1/units',
    state: 'new compact form with long name entered; no submission',
  },
  {
    name: 'recipes',
    route: '/recipes',
    heading: 'My Recipes',
    content: 'Tomato and brown rice bowl',
    endpoint: 'GET /api/v1/recipes',
    state: 'populated recipe list with available and missing stock',
  },
  {
    name: 'shopping',
    route: '/shopping-list',
    heading: 'Shopping List',
    content: longIngredientName,
    endpoint: 'GET /api/v1/shopping-list',
    state: 'populated list with checked and unchecked items',
  },
];

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as BaselineTheme[]) {
    for (const target of pages.filter(
      (target) =>
        !geometryPilots || ['home', 'ingredient-items', 'add-ingredient'].includes(target.name),
    )) {
      test(`${target.name} ${viewport.name} ${theme} baseline`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        const failedRequests: { url: string; error: string | null }[] = [];
        const httpErrors: { url: string; status: number }[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', (error) => pageErrors.push(error.message));
        page.on('requestfailed', (request) =>
          failedRequests.push({
            url: request.url(),
            error: request.failure()?.errorText ?? null,
          }),
        );
        page.on('response', (response) => {
          if (response.status() >= 400)
            httpErrors.push({ url: response.url(), status: response.status() });
        });
        const fixture = await installDesignBaseline(page, theme);
        const filename = `${target.name}-${viewport.name}-${theme}`;
        await mkdir(evidenceDirectory, { recursive: true });
        let capture: string | null = null;
        try {
          await page.goto(target.route);
          await expect(
            page
              .getByRole('heading', { name: target.heading, exact: true })
              .and(page.locator('.type-page-title')),
          ).toBeVisible();
          await expect.poll(() => fixture.servedRequests).toContain(target.endpoint);
          if (target.name === 'add-ingredient') {
            await page.locator('#add-ingredient-name').fill(target.content);
            await expect(page.locator('#add-ingredient-name')).toHaveValue(target.content);
            await expect
              .poll(() => fixture.servedRequests)
              .toContain('GET /api/v1/ingredient-groups');
          } else if (target.name === 'add-item') {
            await expect(page.locator('#ingredient')).toContainText(target.content);
          } else {
            await expect(
              page.getByText(target.content, { exact: true }).filter({ visible: true }).first(),
            ).toBeVisible();
          }
          await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
          await expect
            .poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark')))
            .toBe(theme === 'dark');
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => document.fonts.ready);
          capture = `${filename}.png`;
          await page.screenshot({
            path: path.join(evidenceDirectory, capture),
            fullPage: true,
            animations: 'disabled',
          });
          await testInfo.attach(filename, {
            path: path.join(evidenceDirectory, capture),
            contentType: 'image/png',
          });
          expect(
            fixture.unexpectedRequests,
            'Every API request needs an explicit synthetic fixture',
          ).toEqual([]);
          expect(pageErrors, 'Uncaught browser errors').toEqual([]);
          expect(consoleErrors, 'Browser console errors').toEqual([]);
          expect(httpErrors, 'HTTP errors, including missing assets').toEqual([]);
          expect(failedRequests, 'Failed network requests, including external icon fonts').toEqual(
            [],
          );
        } finally {
          const typography = await page
            .locator('.type-page-title')
            .first()
            .evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
              };
            })
            .catch(() => null);
          await writeFile(
            path.join(evidenceDirectory, `${filename}.json`),
            JSON.stringify(
              {
                route: target.route,
                observedUrl: page.url(),
                theme,
                observedTheme: await page
                  .locator('html')
                  .evaluate((element) => (element.classList.contains('dark') ? 'dark' : 'light'))
                  .catch(() => null),
                viewport,
                state: target.state,
                fixture: fixtureVersion,
                fixtureNow,
                revision,
                workingTreeDirty,
                trackedDiffSha256: createHash('sha256').update(trackedDiff).digest('hex'),
                sourceTreeSha256,
                project: testInfo.project.name,
                browserVersion: page.context().browser()?.version(),
                platform: process.platform,
                capturedAt: new Date().toISOString(),
                reducedMotion: true,
                capture,
                typography,
                innerScrollContainers: await page
                  .locator('main')
                  .evaluate((main) => {
                    const containers = [];
                    let node: HTMLElement | null = main.parentElement;
                    while (node) {
                      if (
                        node.scrollHeight > node.clientHeight &&
                        ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)
                      ) {
                        containers.push({
                          tag: node.tagName,
                          clientHeight: node.clientHeight,
                          scrollHeight: node.scrollHeight,
                          scrollTop: node.scrollTop,
                        });
                      }
                      node = node.parentElement;
                    }
                    return containers;
                  })
                  .catch(() => []),
                captureLimit:
                  'The application scrolls inside a fixed-height shell. Full-page browser capture can omit content below the inner scroll viewport; inspect scroll-container metadata and exercise lower sections separately.',
                horizontalOverflow: await page
                  .evaluate(() => document.documentElement.scrollWidth > innerWidth)
                  .catch(() => null),
                observations: { ...fixture, consoleErrors, pageErrors, failedRequests, httpErrors },
                reviewStatus:
                  'Pending human visual inspection; capture does not establish acceptance',
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
