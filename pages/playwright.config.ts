import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use local dev server for testing
const baseURL = process.env.BASE_URL || 'http://localhost:5173';
console.log('Using baseURL:', baseURL);

export default defineConfig({
  testDir: process.env.TEST_TYPE === 'extension' ? './src/extension/__tests__' : './e2e',
  testMatch: process.env.TEST_TYPE === 'extension' ? '**/extension.spec.ts' : '**/home.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    serviceWorkers: 'allow', // Allow service workers for extension tests
    launchOptions: {
      slowMo: process.env.CI ? 500 : 100,
      timeout: process.env.CI ? 60000 : 30000,
    },
    contextOptions: {
      acceptDownloads: true,
      bypassCSP: true,
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        ...(process.env.TEST_TYPE === 'extension' ? {
          // Launch options for Chrome with the extension
          launchOptions: {
            args: [
              `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
              `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--enable-automation',
              '--remote-debugging-port=0',
              '--allow-insecure-localhost',
              '--enable-features=NetworkService,NetworkServiceInProcess',
              '--enable-logging=stderr',
              '--v=1',
              '--enable-logging',
              '--log-level=0',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--enable-automation',
              '--enable-features=NetworkService,NetworkServiceInProcess',
              '--allow-insecure-localhost',
              '--allow-running-insecure-content',
              '--allow-file-access-from-files',
              '--allow-file-access',
              '--allow-legacy-extension-manifests',
              '--allow-external-pages',
              '--allow-chrome-urls',
            ],
            slowMo: 100,
            timeout: 60000,
          },
          contextOptions: {
            acceptDownloads: true,
            bypassCSP: true,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true,
          },
        } : {}),
      },
    },
  ],
  outputDir: 'test-results',
});