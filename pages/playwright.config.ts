import { defineConfig } from '@playwright/test';
import { paths } from './config';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    // Base URL for page tests, can be overridden in individual tests
    baseURL: process.env.API_URL || 'http://localhost:8787',
    screenshot: 'on',  // Always capture screenshots
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
  reporter: process.env.CI ? 'github' : 'list',  // Better output formatting for each environment
});
