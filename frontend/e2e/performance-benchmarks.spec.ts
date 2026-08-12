import { CDPSession, expect, test } from '@playwright/test';

/**
 * Pantry Angular Application - E2E Browser Performance Benchmark Test Suite
 *
 * Measures:
 * 1. Initial Route Load & Navigation Speed across /, /inventory, /inventory/items, /recipes, /meal-planner
 * 2. Memory Leak & JS Heap Stability across 10x repeated tab navigation passes
 * 3. Layout Reflow & Recalc Style Overhead during search filtering in Inventory
 * 4. Interaction-to-Next-Paint (INP) & click-to-render latency on modals & tabs
 */

// Helper to convert bytes to megabytes (MB)
function bytesToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

// Helper to fetch CDP metrics map from CDPSession
async function getCDPMetrics(client: CDPSession): Promise<Record<string, number>> {
  const { metrics } = await client.send('Performance.getMetrics');
  const result: Record<string, number> = {};
  for (const m of metrics) {
    result[m.name] = m.value;
  }
  return result;
}

// Set up mock network endpoints for isolated frontend performance testing
async function setupApiMocks(page: any) {
  // Mock Auth Silent Refresh
  await page.route('**/api/v1/auth/refresh', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: { accessToken: 'fake-jwt-token-perf' },
      },
    });
  });

  // Mock User Profile & Active Kitchen
  await page.route('**/api/v1/me/profile', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: {
          user: { id: 'usr-1', email: 'perf@example.com', name: 'Perf Tester' },
          memberships: [{ id: 'k1', name: 'Main Kitchen', role: 'owner' }],
        },
      },
    });
  });

  // Mock Locations
  await page.route('**/api/locations', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          { id: 1, name: 'Fridge' },
          { id: 2, name: 'Pantry' },
          { id: 3, name: 'Freezer' },
        ],
      },
    });
  });

  // Mock Measurement Units
  await page.route('**/api/units', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          { id: 1, name: 'pieces', shortName: 'pcs', type: 'Count', toBaseFactor: 1 },
          { id: 2, name: 'grams', shortName: 'g', type: 'Weight', toBaseFactor: 1 },
          { id: 3, name: 'liters', shortName: 'L', type: 'Volume', toBaseFactor: 1 },
        ],
      },
    });
  });

  // Mock Ingredient Catalog
  await page.route('**/api/ingredients', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          { id: 'ing-1', name: 'Whole Milk', defaultUnitId: 3 },
          { id: 'ing-2', name: 'Jasmine Rice', defaultUnitId: 2 },
          { id: 'ing-3', name: 'Chicken Breast', defaultUnitId: 2 },
          { id: 'ing-4', name: 'Organic Eggs', defaultUnitId: 1 },
        ],
      },
    });
  });

  // Mock Categories & Groups
  await page.route('**/api/ingredient-categories', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { status: 'success', data: [] },
    });
  });

  await page.route('**/api/ingredient-groups', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { status: 'success', data: [] },
    });
  });

  // Mock Ingredient Items DTOs (20 items for realistic rendering)
  await page.route('**/api/ingredient-items', async (route: any) => {
    const names = [
      'Whole Milk',
      'Jasmine Rice',
      'Chicken Breast',
      'Organic Eggs',
      'Greek Yogurt',
      'Cheddar Cheese',
      'Butter',
      'Olive Oil',
      'Garlic Powder',
      'Black Pepper',
      'Sea Salt',
      'Tomatoes',
      'Onions',
      'Carrots',
      'Spinach',
      'Broccoli',
      'Avocado',
      'Apples',
      'Bananas',
      'Sourdough Bread',
    ];
    const items = names.map((label, i) => ({
      id: `item-${i + 1}`,
      label,
      quantity: (i + 1) * 2,
      unitId: (i % 3) + 1,
      locationId: (i % 3) + 1,
      ingredientId: `ing-${(i % 4) + 1}`,
      purchaseDate: '2026-08-01T00:00:00.000Z',
      expirationDate: i % 2 === 0 ? '2026-08-20T00:00:00.000Z' : '2026-08-10T00:00:00.000Z',
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { status: 'success', data: items },
    });
  });

  // Mock Recipes
  await page.route('**/api/recipes', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          {
            id: 'rec-1',
            name: 'Creamy Chicken Alfredo',
            description: 'Rich pasta dish with parmesan and garlic',
            prepTimeMinutes: 15,
            cookTimeMinutes: 20,
            servings: 4,
            difficulty: 'Medium',
            ingredients: [],
            steps: [],
          },
          {
            id: 'rec-2',
            name: 'Avocado Toast & Eggs',
            description: 'Quick nutritious breakfast',
            prepTimeMinutes: 5,
            cookTimeMinutes: 5,
            servings: 1,
            difficulty: 'Easy',
            ingredients: [],
            steps: [],
          },
        ],
      },
    });
  });

  // Mock Meal Plans
  await page.route('**/api/meal-plans', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          {
            id: 'mp-1',
            day: 'Monday',
            mealType: 'Dinner',
            recipeName: 'Creamy Chicken Alfredo',
            prepTimeMinutes: 35,
            calories: 650,
            servings: 4,
            cooked: false,
            missingIngredients: [],
            tags: ['Pasta'],
          },
        ],
      },
    });
  });

  // Mock Shopping List
  await page.route('**/api/shopping-list', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        status: 'success',
        data: [
          {
            id: 'sl-1',
            name: 'Parmesan Cheese',
            category: 'Dairy',
            quantity: 1,
            unit: 'pcs',
            checked: false,
            estimatedPrice: 3.5,
            source: 'manual',
          },
        ],
      },
    });
  });
}

test.describe('Pantry Application Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('1. Initial Route Load & Navigation Speed across major routes', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    const routesToTest = [
      { path: '/home', name: 'Dashboard / Home', selector: 'main h1' },
      { path: '/inventory', name: 'Inventory Overview', selector: 'main h2' },
      { path: '/inventory/items', name: 'Inventory Items Table', selector: 'main h2' },
      { path: '/recipes', name: 'Recipes', selector: 'main h1' },
      { path: '/meal-planner', name: 'Meal Planner', selector: 'main h1' },
    ];

    const results: Array<{
      route: string;
      path: string;
      navigationTimeMs: number;
      ttfbMs: number;
      domContentLoadedMs: number;
      jsHeapUsedMB: number;
    }> = [];

    for (const target of routesToTest) {
      const startTime = Date.now();
      await page.goto(target.path, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(target.selector, { state: 'visible' });
      const endTime = Date.now();
      const navigationTimeMs = endTime - startTime;

      const navTiming = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (entry) {
          return {
            ttfb: Math.round(entry.responseStart - entry.requestStart),
            domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
            loadEvent: Math.round(entry.loadEventEnd - entry.startTime),
          };
        }
        return { ttfb: 0, domContentLoaded: 0, loadEvent: 0 };
      });

      const cdpMetrics = await getCDPMetrics(client);
      const jsHeapUsedMB = parseFloat(bytesToMB(cdpMetrics.JSHeapUsedSize || 0));

      results.push({
        route: target.name,
        path: target.path,
        navigationTimeMs,
        ttfbMs: navTiming.ttfb,
        domContentLoadedMs: navTiming.domContentLoaded,
        jsHeapUsedMB,
      });

      // Assert navigation response budget (< 3000ms client-side load threshold)
      expect(navigationTimeMs).toBeLessThan(3000);
    }

    console.log(
      '\n================ Performance Benchmark: Initial Route Load & Navigation Speed ================',
    );
    console.table(results);
  });

  test('2. Memory Leak & JS Heap Stability across 10x repeated tab navigations', async ({
    page,
  }) => {
    test.setTimeout(120000); // 2 minute timeout for 10x full loop

    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('HeapProfiler.enable');

    // Initial navigation to warm up Angular components and modules
    await page.goto('/home');
    await page.waitForSelector('main h1', { state: 'visible' });

    // Force GC before baseline reading
    await client.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(500);

    const initialMetrics = await getCDPMetrics(client);
    const initialHeap = initialMetrics.JSHeapUsedSize || 0;
    const initialHeapMB = parseFloat(bytesToMB(initialHeap));

    const routes = [
      { path: '/inventory', selector: 'main h2' },
      { path: '/inventory/items', selector: 'main h2' },
      { path: '/recipes', selector: 'main h1' },
      { path: '/meal-planner', selector: 'main h1' },
      { path: '/home', selector: 'main h1' },
    ];
    const PASS_COUNT = 10;

    console.log(`Starting ${PASS_COUNT}x repeated tab navigation passes...`);

    for (let i = 1; i <= PASS_COUNT; i++) {
      for (const r of routes) {
        await page.goto(r.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector(r.selector, { state: 'visible' });
      }
    }

    // Force GC after 10x navigation passes to collect unreferenced memory
    await client.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(500);

    const finalMetrics = await getCDPMetrics(client);
    const finalHeap = finalMetrics.JSHeapUsedSize || 0;
    const finalHeapMB = parseFloat(bytesToMB(finalHeap));

    const heapGrowthBytes = finalHeap - initialHeap;
    const heapGrowthMB = parseFloat(bytesToMB(Math.max(0, heapGrowthBytes)));
    const growthPercentage =
      initialHeap > 0 ? ((heapGrowthBytes / initialHeap) * 100).toFixed(2) : '0';

    console.log(
      '\n================ Performance Benchmark: Memory Leak & JS Heap Stability ================',
    );
    console.log(`Initial JS Heap (after GC): ${initialHeapMB} MB`);
    console.log(`Final JS Heap (after ${PASS_COUNT}x passes & GC): ${finalHeapMB} MB`);
    console.log(`Net JS Heap Growth: ${heapGrowthMB} MB (${growthPercentage}% change)`);

    // Assert that net JS Heap growth after 10 full navigation loops is bounded (< 15 MB)
    expect(heapGrowthMB).toBeLessThan(15);
  });

  test('3. Layout Reflow & Recalc Style Overhead during search filtering', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/inventory/items');
    await page.waitForSelector('table', { state: 'visible' });

    // Baseline CDP metrics
    const baselineMetrics = await getCDPMetrics(client);
    const baselineLayoutCount = baselineMetrics.LayoutCount || 0;
    const baselineRecalcStyleCount = baselineMetrics.RecalcStyleCount || 0;

    // Perform search & filter actions in Inventory
    const searchInput = page.locator('input[placeholder*="Search"]');

    // Search 1: Milk
    await searchInput.fill('Milk');
    await page.waitForTimeout(100);

    // Clear & Search 2: Rice
    await searchInput.fill('');
    await searchInput.fill('Rice');
    await page.waitForTimeout(100);

    // Clear & Search 3: Eggs
    await searchInput.fill('');
    await searchInput.fill('Eggs');
    await page.waitForTimeout(100);

    // Clear search
    await searchInput.fill('');

    // Toggle status filter buttons
    const statusButtons = page.locator(
      'button:has-text("Fresh"), button:has-text("Near Expiry"), button:has-text("Expired"), button:has-text("All")',
    );
    const count = await statusButtons.count();
    for (let i = 0; i < count; i++) {
      await statusButtons.nth(i).click();
      await page.waitForTimeout(50);
    }

    // Final CDP metrics
    const finalMetrics = await getCDPMetrics(client);
    const finalLayoutCount = finalMetrics.LayoutCount || 0;
    const finalRecalcStyleCount = finalMetrics.RecalcStyleCount || 0;

    const layoutDelta = finalLayoutCount - baselineLayoutCount;
    const recalcStyleDelta = finalRecalcStyleCount - baselineRecalcStyleCount;

    console.log(
      '\n================ Performance Benchmark: Layout Reflow & Recalc Style Overhead ================',
    );
    console.log(`Layout Count Delta: ${layoutDelta}`);
    console.log(`Recalc Style Count Delta: ${recalcStyleDelta}`);
    console.log(`Task Duration: ${(finalMetrics.TaskDuration || 0).toFixed(4)} s`);
    console.log(`Layout Duration: ${(finalMetrics.LayoutDuration || 0).toFixed(4)} s`);
    console.log(`Recalc Style Duration: ${(finalMetrics.RecalcStyleDuration || 0).toFixed(4)} s`);

    // Assert reflow overhead is within reasonable bounds
    expect(layoutDelta).toBeLessThan(150);
    expect(recalcStyleDelta).toBeLessThan(300);
  });

  test('4. Interaction-to-Next-Paint (INP) & click-to-render latency on key actions', async ({
    page,
  }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    const inpResults: Array<{ action: string; latencyMs: number }> = [];

    // Action A: Open Add Item Modal in Inventory Items Page
    await page.goto('/inventory/items');
    await page.waitForSelector('button:has-text("Add New Item")', { state: 'visible' });

    const modalLatency = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Add New Item'),
      );
      if (!btn) return -1;
      const start = performance.now();
      btn.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Math.round(performance.now() - start);
    });

    await expect(page.locator('p-dialog:has-text("Add New Pantry Item")')).toBeVisible();
    inpResults.push({ action: 'Open Add Item Modal', latencyMs: modalLatency });

    // Action B: Switch Sub-Tabs in Meal Planner
    await page.goto('/meal-planner');
    await page.waitForSelector('button:has-text("Daily Focus")', { state: 'visible' });

    const dailyFocusTabLatency = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Daily Focus'),
      );
      if (!btn) return -1;
      const start = performance.now();
      btn.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Math.round(performance.now() - start);
    });
    await expect(page.locator('pantry-daily-focus')).toBeVisible();
    inpResults.push({ action: 'Switch to Daily Focus Sub-Tab', latencyMs: dailyFocusTabLatency });

    const calendarTabLatency = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Weekly Calendar'),
      );
      if (!btn) return -1;
      const start = performance.now();
      btn.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Math.round(performance.now() - start);
    });
    await expect(page.locator('pantry-weekly-view')).toBeVisible();
    inpResults.push({ action: 'Switch to Weekly Calendar Sub-Tab', latencyMs: calendarTabLatency });

    // Action C: Click Status Filter Pill in Inventory Items
    await page.goto('/inventory/items');
    await page.waitForSelector('button:has-text("Near Expiry")', { state: 'visible' });

    const filterPillLatency = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Near Expiry'),
      );
      if (!btn) return -1;
      const start = performance.now();
      btn.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Math.round(performance.now() - start);
    });
    inpResults.push({
      action: 'Click Status Filter Pill (Near Expiry)',
      latencyMs: filterPillLatency,
    });

    console.log(
      '\n================ Performance Benchmark: Interaction-to-Next-Paint (INP) Latency ================',
    );
    console.table(inpResults);

    // Assert INP click-to-render latency is < 200ms
    for (const res of inpResults) {
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.latencyMs).toBeLessThan(200);
    }
  });
});
