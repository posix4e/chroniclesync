import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './src/extension/__tests__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Launch options for Chrome with the extension
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
          ],
        },
      },
    },
  ],
});