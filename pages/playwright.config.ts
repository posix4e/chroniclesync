import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use staging environment for E2E tests, local for unit tests
const isE2E = process.env.TEST_TYPE === 'e2e';
const baseURL = process.env.BASE_URL || (isE2E ? 'https://staging.chroniclesync.xyz' : 'http://localhost:5173');
console.log('Using baseURL:', baseURL);

// Get the API URL based on environment
const apiURL = process.env.API_URL || (isE2E ? 'https://api-staging.chroniclesync.xyz' : 'http://localhost:8787');
console.log('Using API URL:', apiURL);

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
      acceptDownloads: true
    }
  },
  projects: [
    {
      name: 'basic',
      testMatch: /.*@basic.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',
            '--remote-debugging-port=0',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--enable-logging=stderr',
            '--v=1',
            '--enable-logging',
            '--log-level=0',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
          slowMo: 100,
          timeout: 60000,
        },
        contextOptions: {
          acceptDownloads: true,
          viewport: { width: 1280, height: 720 },
        },
      },
    },
    {
      name: 'history',
      testMatch: /.*@history.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',
            '--remote-debugging-port=0',
            '--enable-features=NetworkService,NetworkServiceInProcess',
          ],
          slowMo: 100,
          timeout: 120000, // 2 minutes for history tests
        },
        contextOptions: {
          acceptDownloads: true,
          viewport: { width: 1280, height: 720 },
        },
      },
    },
    {
      name: 'network',
      testMatch: /.*@network.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',
            '--remote-debugging-port=0',
            '--enable-features=NetworkService,NetworkServiceInProcess',
          ],
          slowMo: 100,
          timeout: 90000, // 90 seconds for network tests
        },
        contextOptions: {
          acceptDownloads: true,
          viewport: { width: 1280, height: 720 },
        },
      },
    },
    {
      name: 'security',
      testMatch: /.*@security.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist/chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist/chrome')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',
            '--remote-debugging-port=0',
            '--enable-features=NetworkService,NetworkServiceInProcess',
          ],
          slowMo: 100,
          timeout: 30000, // 30 seconds for security tests
        },
        contextOptions: {
          acceptDownloads: true,
          viewport: { width: 1280, height: 720 },
        },
      },
    },
  ],
  outputDir: 'test-results',
});