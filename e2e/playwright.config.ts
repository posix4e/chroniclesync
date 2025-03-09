import { defineConfig } from '@playwright/test';
import path from 'path';

// Paths to extension builds
const CHROME_EXTENSION_PATH = path.join(__dirname, '../dist/chrome');
const FIREFOX_EXTENSION_PATH = path.join(__dirname, '../dist/firefox');

export default defineConfig({
  globalSetup: './global-setup.ts',
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  testDir: './',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  forbidOnly: !!process.env.CI,  // Prevent .only tests in CI
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
            `--disable-extensions-except=${CHROME_EXTENSION_PATH}`,
            `--load-extension=${CHROME_EXTENSION_PATH}`,
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
            '-profile',
            path.join(__dirname, 'firefox-profile'),
            '-headless',
          ],
          // Firefox extension is loaded differently
          // We'll need to use web-ext or a custom setup
        },
        // Firefox extension loading is handled in global-setup.ts
      },
    },
  ],
  outputDir: '../test-results/',
});