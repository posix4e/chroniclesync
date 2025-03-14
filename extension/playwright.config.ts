import { defineConfig } from '@playwright/test';
import { paths } from './src/config';

// Get the browser from environment variable or default to chromium
const browser = process.env.BROWSER || 'chromium';

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
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        // For desktop Safari testing
      },
    },
    {
      name: 'ios-safari',
      use: {
        browserName: 'webkit',
        // iOS Safari specific configuration
        isMobile: true,
        deviceScaleFactor: 2,
        hasTouch: true,
        defaultBrowserType: 'webkit',
        // Common iOS device configurations
        viewport: { width: 390, height: 844 }, // iPhone 13 Pro dimensions
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
  outputDir: (() => {
    if (browser === 'firefox') return 'test-results/firefox/';
    if (browser === 'webkit') return 'test-results/webkit/';
    if (browser === 'ios-safari') return 'test-results/ios-safari/';
    return 'test-results/chrome/';
  })(),
});
