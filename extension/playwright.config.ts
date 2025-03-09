import { defineConfig } from '@playwright/test';
import { paths } from './src/config';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Determine which extension package to use based on browser
function getExtensionPath(browserName: string): string {
  // Default to the dist directory for development
  let extensionPath = paths.extension;
  
  // Check if we have browser-specific packages available
  const chromePackage = resolve(__dirname, 'package/chrome');
  const firefoxPackage = resolve(__dirname, 'package/firefox');
  const safariPackage = resolve(__dirname, 'package/safari');
  
  if (browserName === 'chromium' && existsSync(chromePackage)) {
    extensionPath = chromePackage;
  } else if (browserName === 'firefox' && existsSync(firefoxPackage)) {
    extensionPath = firefoxPackage;
  } else if (browserName === 'webkit' && existsSync(safariPackage)) {
    extensionPath = safariPackage;
  }
  
  console.log(`Using extension path for ${browserName}:`, extensionPath);
  return extensionPath;
}

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
            `--disable-extensions-except=${getExtensionPath('chromium')}`,
            `--load-extension=${getExtensionPath('chromium')}`,
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
            'extensions.webextensions.uuids': '{"chroniclesync@chroniclesync.xyz": "test-extension-id"}',
            'xpinstall.signatures.required': false,
          },
          args: [
            '-headless',
          ],
        },
        // Firefox extension is loaded differently via the extension utils
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        // Safari/WebKit testing is primarily for UI compatibility
        // Full extension testing requires macOS and Safari
      },
    },
  ],
  outputDir: 'test-results/',
});
