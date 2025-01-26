import { defineConfig } from '@playwright/test';
import { paths } from './config';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: process.env.CI ? true : false,
    baseURL: process.env.API_URL || 'http://localhost:8787',
    screenshot: 'on',  // Always capture screenshots
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  timeout: 30000,
  expect: {
    timeout: 5000,
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
  forbidOnly: true,  // Always prevent .only tests
  workers: 1,  // Consistent, predictable test execution
  reporter: process.env.CI ? [
    ['list'],
    ['github'],
    ['html', { open: 'never' }]
  ] : 'list',
  globalSetup: './e2e/global-setup.ts',
});