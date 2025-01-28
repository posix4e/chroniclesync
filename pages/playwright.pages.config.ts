import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /pages\.spec\.ts/,
  use: {
    baseURL: 'http://localhost:53374',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:53374',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: process.env.CI ? 'github' : 'list',
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
});