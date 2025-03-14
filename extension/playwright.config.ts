import { defineConfig } from '@playwright/test';
import { paths } from './src/config';

// Get the browser from environment variable or default to chromium
const browser = process.env.BROWSER || 'chromium';

// Determine output directory based on browser
const getOutputDir = () => {
  switch (browser) {
  case 'firefox':
    return 'test-results/firefox/';
  case 'webkit':
    return 'test-results/webkit/';
  default:
    return 'test-results/chrome/';
  }
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
    // Use headless mode for WebKit and when running in CI, otherwise use headed mode for extension testing
    headless: browser === 'webkit' || process.env.CI ? true : false,
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
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        // WebKit (Safari) testing without extension loading
        // Used for basic compatibility testing
      },
    },
    {
      name: 'webkit-ios-simulator',
      use: {
        browserName: 'webkit',
        // iOS simulator specific configuration
        isMobile: true,
        deviceScaleFactor: 2,
        hasTouch: true,
        defaultBrowserType: 'webkit',
        // WebKit doesn't support loading extensions via command line args
        // We'll simulate extension behavior in the tests
        launchOptions: {
          // No extension loading args for WebKit
          args: [],
        },
      },
    },
  ],
  outputDir: getOutputDir(),
});
