import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { installDesignBaseline } from './fixtures/design-baseline';

interface TraceEvent {
  name: string;
  pid: number;
  tid: number;
  ph: string;
  dur?: number;
  ts: number;
  args?: { name?: string; data?: Record<string, unknown> };
}

for (const { route, width } of [
  { route: '/auth/login', width: 1440 },
  { route: '/home', width: 1440 },
  { route: '/home', width: 390 },
]) {
  test(`background motion caps canvas work and respects reduced motion: ${route} at ${width}px`, async ({
    page,
  }, testInfo) => {
    await installDesignBaseline(page, 'light');
    if (route === '/auth/login') {
      await page.route('**/api/v1/auth/refresh', (request) =>
        request.fulfill({ status: 401, json: { status: 'error', message: 'Unauthenticated' } }),
      );
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.clearRect;
      (window as unknown as { backgroundDraws: number }).backgroundDraws = 0;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas === document.querySelector('pantry-root canvas')) {
          (window as unknown as { backgroundDraws: number }).backgroundDraws++;
        }
        return original.apply(this, args);
      };
    });
    await page.goto(`${process.env['IDLE_BASE_URL'] ?? ''}${route}`);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await page.waitForTimeout(2000);
    const waves = page.locator('.ambient-waves');
    const layers = waves.locator('.ambient-wave');
    await expect(layers).toHaveCount(3);
    const animationNames = await layers.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
    expect(new Set(animationNames).size).toBe(3);
    animationNames.forEach((name, index) => {
      expect(name).toMatch(new RegExp(`(?:^|_)waveFlow${index + 1}$`));
    });
    expect(
      await layers.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).animationDuration),
      ),
    ).toEqual(['18s', '22s', '26s']);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const initialTransform = await layers.first().evaluate((el) => getComputedStyle(el).transform);
    await expect
      .poll(() => layers.first().evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(initialTransform);
    const readDrawCount = () =>
      page.evaluate(() => (window as unknown as { backgroundDraws: number }).backgroundDraws);
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    const before = await client.send('Performance.getMetrics');
    const events: TraceEvent[] = [];
    client.on('Tracing.dataCollected', ({ value }) => events.push(...value));
    await client.send('Tracing.start', {
      categories:
        'toplevel,devtools.timeline,v8,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler',
      options: 'sampling-frequency=1000',
    });
    const drawsBefore = await readDrawCount();
    await page.waitForTimeout(10_000);
    const canvasDraws = (await readDrawCount()) - drawsBefore;
    const finished = new Promise<void>((resolve) =>
      client.once('Tracing.tracingComplete', () => resolve()),
    );
    await client.send('Tracing.end');
    await finished;
    const after = await client.send('Performance.getMetrics');
    const main = events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
    expect(main, 'Trace must contain the renderer main thread').toBeDefined();
    const mainEvents = events.filter((e) => e.pid === main?.pid && e.tid === main?.tid);
    const tasks = mainEvents.filter(
      (e) => (e.name === 'RunTask' || e.name.endsWith('::RunTask')) && e.ph === 'X',
    );
    const counts: Record<string, number> = {};
    for (const e of mainEvents) counts[e.name] = (counts[e.name] ?? 0) + 1;
    const metrics = Object.fromEntries(
      after.metrics.map((m) => [
        m.name,
        m.value - (before.metrics.find((b) => b.name === m.name)?.value ?? 0),
      ]),
    );
    const summary = {
      url: page.url(),
      canvasDraws,
      counts,
      metrics,
      longTasks: tasks
        .filter((e) => (e.dur ?? 0) > 50_000)
        .map((e) => ({ ms: (e.dur ?? 0) / 1000, ts: e.ts })),
      functions: mainEvents
        .filter((e) => e.name === 'FunctionCall')
        .slice(0, 5)
        .map((e) => e.args?.data),
      errors,
    };
    await writeFile(
      testInfo.outputPath('idle-trace.json'),
      JSON.stringify({ traceEvents: events }),
    );
    await writeFile(testInfo.outputPath('summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
    await page.screenshot({ path: testInfo.outputPath('idle.png') });
    expect(errors).toEqual([]);
    expect(canvasDraws).toBeGreaterThan(0);
    expect(canvasDraws).toBeLessThanOrEqual(310);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(waves).toHaveClass(/is-paused/);
    for (const layer of await layers.all()) {
      await expect(layer).toHaveCSS('animation-name', 'none');
    }
    const reducedDraws = await readDrawCount();
    await page.waitForTimeout(1000);
    expect(await readDrawCount()).toBe(reducedDraws);
    await page.screenshot({ path: testInfo.outputPath('reduced-motion.png') });
  });
}
