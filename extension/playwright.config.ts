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
        // WebKit is used for iOS Safari testing
        // We'll use the ios-safari-extension.zip file that we build
        launchOptions: {
          args: [
            '--enable-extension-support',
          ],
        },
        // iOS Safari specific settings
        contextOptions: {
          viewport: { width: 375, height: 667 }, // iPhone 8 dimensions
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          isMobile: true,
          hasTouch: true,
        },
      },
    },
  ],
  outputDir: browser === 'firefox' ? 'test-results/firefox/' : 
    browser === 'webkit' ? 'test-results/ios-safari/' : 'test-results/chrome/',
});
