import { defineConfig } from '@playwright/test';
import { paths } from './config';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    // Base URL for page tests, can be overridden in individual tests
    baseURL: process.env.API_URL || 'http://localhost:8787',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--disable-extensions-except=${paths.extension}`,
            `--load-extension=${paths.extension}`,
          ],
        },
      },
    },
  ],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './e2e/global-setup.ts',
});