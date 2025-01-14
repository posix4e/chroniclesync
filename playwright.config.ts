import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = process.env.EXTENSION_PATH || path.join(__dirname, '../extension-build');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://staging.chroniclesync.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          extensions: [EXTENSION_PATH],
        },
      },
    },
  ],
  outputDir: 'test-results/',
});