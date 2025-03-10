import { defineConfig } from '@playwright/test';
import { paths } from '../src/config';
import path from 'path';
import * as fs from 'fs';

// Create base directories for extensions if they don't exist
const extensionBaseDir = path.join(paths.extension, '..');
fs.mkdirSync(path.join(extensionBaseDir, 'firefox-extension'), { recursive: true });
fs.mkdirSync(path.join(extensionBaseDir, 'firefox-user-data'), { recursive: true });
fs.mkdirSync(path.join(extensionBaseDir, 'firefox-temp-ext'), { recursive: true });

// Define paths for Firefox extension
const extensionPaths = {
  firefox: path.join(extensionBaseDir, 'firefox-extension'),
  userDataDir: path.join(extensionBaseDir, 'firefox-user-data'),
  tempExtDir: path.join(extensionBaseDir, 'firefox-temp-ext'),
};

export default defineConfig({
  globalSetup: './global-setup.ts',
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  timeout: 120000, // Increase timeout for Firefox tests
  workers: 1, // Run tests sequentially for Firefox

  use: {
    // Base options for all tests
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
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
            // Allow loading extensions from any location
            'extensions.webextensions.remote': true,
            'extensions.langpacks.signatures.required': false,
            'extensions.experiments.enabled': true,
            // Disable extension signature verification
            'extensions.install.requireBuiltInCerts': false,
            'extensions.update.requireBuiltInCerts': false,
          },
          args: [
            '-wait-for-browser',
            '-foreground',
            '-no-remote',
          ],
          // Firefox extension testing works better in headless mode in CI
          headless: true,
        },
        // Increase timeouts for Firefox which can be slower with extensions
        actionTimeout: 60000,
        navigationTimeout: 60000,
      },
    },
  ],
  outputDir: '../test-results/',
});