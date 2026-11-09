/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [angular()],
  // Keep the Vite/Vitest cache in frontend/node_modules (gitignored), not src/node_modules.
  cacheDir: resolve(__dirname, './node_modules/.vite'),
  resolve: {
    alias: {
      '@models': resolve(__dirname, './src/app/models'),
      '@services': resolve(__dirname, './src/app/services'),
      '@utility': resolve(__dirname, './src/app/utility'),
      '@components': resolve(__dirname, './src/app/components'),
      '@ui': resolve(__dirname, './src/app/components/ui'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
