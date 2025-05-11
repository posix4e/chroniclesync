import { defineConfig } from '@playwright/test';
import path from 'path';

// Configuration for the p2p testing environment
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 60000, // Longer timeout for p2p operations
  expect: {
    timeout: 10000, // Longer timeout for expectations
  },
  fullyParallel: false, // Run tests sequentially for p2p testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid conflicts in p2p testing
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    headless: process.env.CI ? true : false, // Headless in CI, non-headless for local debugging
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000, // Longer timeout for actions
    navigationTimeout: 30000, // Longer timeout for navigation
    screenshot: 'on', // Capture screenshots for all tests
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:12000', // Use the provided port for the first instance
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
            '--disable-web-security', // Allow cross-origin requests for p2p
            '--allow-insecure-localhost',
          ],
        },
      },
    },
  ],
  outputDir: 'test-results/',
  globalSetup: './e2e/global-setup.ts',
});