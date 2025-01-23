import { defineConfig, devices } from '@playwright/test';
import { testConfig } from './e2e/config/test-config';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'chrome-extension://[extension-id]/',
    trace: 'on-first-retry',
    headless: testConfig.headless,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: testConfig.getExtensionArgs(testConfig.extensionPath),
        },
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
});