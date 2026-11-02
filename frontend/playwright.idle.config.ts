import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'idle-performance.spec.ts',
  workers: 1,
  use: { baseURL: 'http://localhost:3000', browserName: 'chromium' },
  webServer: {
    command: 'npm start -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
