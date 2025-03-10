import { defineConfig } from '@playwright/test';
import { paths } from './src/config';
import path from 'path';

// Define paths for each platform's extension
const extensionPaths = {
  chrome: paths.extension,
  firefox: path.join(paths.extension, '..', 'firefox-extension'),
  safari: path.join(paths.extension, '..', 'safari-extension'),
};

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
            `--disable-extensions-except=${extensionPaths.chrome}`,
            `--load-extension=${extensionPaths.chrome}`,
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        launchOptions: {
          firefoxUserPrefs: {
            // Firefox-specific preferences for extension testing
            'extensions.autoDisableScopes': 0,
            'extensions.enableScopes': 15,
          },
          args: [
            '-wait-for-browser',
            '-foreground',
            '-profile',
            extensionPaths.firefox,
          ],
        },
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        // For Safari/WebKit, we'll use a different approach
        // as WebKit in Playwright doesn't directly support extensions
        // We'll use a proxy approach or Safari Web Extension
      },
    },
  ],
  outputDir: 'test-results/',
});
