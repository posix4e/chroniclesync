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
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    headless: true, // Headless mode is fine for regular page tests
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
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
    command: `PORT=51778 npm run dev -- --port 51778 --host 0.0.0.0`,
    url: 'http://localhost:51778',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});