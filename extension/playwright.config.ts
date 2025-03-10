import { defineConfig } from '@playwright/test';
import { paths } from './src/config';
import path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Create base directories for extensions if they don't exist
const extensionBaseDir = path.join(paths.extension, '..');
fs.mkdirSync(path.join(extensionBaseDir, 'firefox-extension'), { recursive: true });
fs.mkdirSync(path.join(extensionBaseDir, 'safari-extension'), { recursive: true });

// Define paths for each platform's extension
const extensionPaths = {
  chrome: paths.extension,
  firefox: path.join(extensionBaseDir, 'firefox-extension'),
  safari: path.join(extensionBaseDir, 'safari-extension'),
  // Add user data directories for persistent contexts
  userDataDirs: {
    chrome: path.join(extensionBaseDir, 'chrome-user-data'),
    firefox: path.join(extensionBaseDir, 'firefox-user-data'),
    webkit: path.join(extensionBaseDir, 'webkit-user-data'),
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
            'xpinstall.signatures.required': false,
            'devtools.browsertoolbox.fission': true,
            'devtools.chrome.enabled': true,
            'devtools.debugger.remote-enabled': true,
          },
          args: [
            '-wait-for-browser',
            '-foreground',
          ],
        },
        // Increase timeouts for Firefox which can be slower with extensions
        actionTimeout: 30000,
        navigationTimeout: 30000,
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        // For Safari/WebKit, we'll use a different approach
        // as WebKit in Playwright doesn't directly support extensions
        // We'll use a mock approach for basic testing
        headless: false,
        viewport: { width: 1280, height: 720 },
        // Set user agent to Safari on macOS
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        // Enable permissions that would be granted to the extension
        permissions: ['geolocation', 'notifications'],
        // Increase timeouts for WebKit
        actionTimeout: 30000,
        navigationTimeout: 30000,
        // Skip certain tests that require extension functionality
        // This is handled in the test files with test.skip()
      },
    },
  ],
  outputDir: 'test-results/',
});
