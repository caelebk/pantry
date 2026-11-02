import { defineConfig } from '@playwright/test';
import config from './playwright.config';

// Isolate phase verification from an already-running developer preview.
export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: 'http://localhost:4201' },
  webServer: {
    command: 'npm start -- --port 4201',
    url: 'http://localhost:4201',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
