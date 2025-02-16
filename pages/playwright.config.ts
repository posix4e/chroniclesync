import { defineConfig } from '@playwright/test';
import { server } from './config';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    headless: true, // Headless mode is fine for regular page tests
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 15000,
    baseURL: server.webUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'NODE_ENV=test npm run dev -- --host 0.0.0.0 --port 56705',
    port: 56705,
    reuseExistingServer: false,
    timeout: 120000,
  },
});