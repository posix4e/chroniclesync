import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use staging environment for E2E tests, local for unit tests
const isE2E = process.env.TEST_TYPE === 'e2e';
const baseURL = process.env.BASE_URL || (isE2E ? 'https://staging.chroniclesync.xyz' : 'http://localhost:3002');
console.log('Using baseURL:', baseURL);

// Get the API URL based on environment
const apiURL = process.env.API_URL || (isE2E ? 'https://api-staging.chroniclesync.xyz' : 'http://localhost:8787');
console.log('Using API URL:', apiURL);

export default defineConfig({
  testDir: '.',
  testMatch: '**/e2e/app.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'allow', // Allow service workers for extension tests
    launchOptions: {
      slowMo: process.env.CI ? 500 : 100,
      timeout: process.env.CI ? 120000 : 60000,
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
    },
    contextOptions: {
      acceptDownloads: true,
      viewport: { width: 1280, height: 720 },
    }
  },
  projects: [
    {
      name: 'basic',
      testMatch: /.*@basic.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          timeout: 60000,
        },
      },
    },
    {
      name: 'history',
      testMatch: /.*@history.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          timeout: 120000, // 2 minutes for history tests
        },
      },
    },
    {
      name: 'network',
      testMatch: /.*@network.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          timeout: 90000, // 90 seconds for network tests
        },
      },
    },
    {
      name: 'security',
      testMatch: /.*@security.*/,
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          timeout: 30000, // 30 seconds for security tests
        },
      },
    },
  ],
  outputDir: 'test-results',
});