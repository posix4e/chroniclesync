import { defineConfig } from '@playwright/test';
import { paths } from './src/config';
import path from 'path';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  forbidOnly: true,  // Always prevent .only tests
  workers: 1,  // Consistent, predictable test execution for extension tests
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    headless: false, // Required for extension testing
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    baseURL: process.env.API_URL || 'https://api-staging.chroniclesync.xyz',
    contextOptions: {
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`[${severity}] ${name}: ${message}`),
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
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
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        // Firefox uses a different mechanism for loading extensions
        // We'll use the firefox-extension.xpi file that we build
        launchOptions: {
          args: [
            '-wait-for-browser',
            '-foreground',
            '-no-remote',
          ],
          firefoxUserPrefs: {
            'xpinstall.signatures.required': false,
            'extensions.autoDisableScopes': 0,
            'extensions.enableScopes': 15,
          },
        },
      },
    },
  ],
  outputDir: 'test-results/',
});
