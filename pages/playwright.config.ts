import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'chrome-extension://[extension-id]/',
    trace: 'on-first-retry',
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-extensions-except=../extension',
            '--load-extension=../extension',
          ],
        },
      },
    },
  ],
});
