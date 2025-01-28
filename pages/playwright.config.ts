import { defineConfig } from '@playwright/test';
import { server } from './config';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    headless: false,
    baseURL: server.webUrl,
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'npm run dev',
    port: Number(new URL(server.webUrl).port),
    reuseExistingServer: !process.env.CI,
  },
});