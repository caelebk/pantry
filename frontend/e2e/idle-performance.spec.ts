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
  test(`shell background is static: ${route} at ${width}px`, async ({ page }, testInfo) => {
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
    await page.goto(`${process.env['IDLE_BASE_URL'] ?? ''}${route}`);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await page.waitForTimeout(2000);
    await expect(page.locator('.shell-atmosphere')).toHaveCount(1);
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) =>
                a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity,
            ).length,
      ),
    ).toBe(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
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
    await page.waitForTimeout(10_000);
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

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) =>
                a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity,
            ).length,
      ),
    ).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('reduced-motion.png') });
  });
}
