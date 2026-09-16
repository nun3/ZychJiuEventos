import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/bdd',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
});
