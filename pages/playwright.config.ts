import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Get the base URL from environment or construct from branch name
const branchName = process.env.GITHUB_HEAD_REF || 'main';
console.log('Branch name:', branchName);
const baseURL = process.env.BASE_URL || (
  branchName === 'main'
    ? 'https://chroniclesync-pages.pages.dev'
    : `https://${branchName}.chroniclesync-pages.pages.dev`
);
console.log('Using baseURL:', baseURL);

export default defineConfig({
  testDir: process.env.TEST_TYPE === 'extension' ? './src/extension/__tests__' : './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    launchOptions: {
      slowMo: 1000,
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
              '--disable-dev-shm-usage',
            ],
            slowMo: 1000,
          },
        } : {}),
      },
    },
  ],
  outputDir: 'test-results',
});