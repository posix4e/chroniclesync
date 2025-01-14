import { defineConfig, devices } from '@playwright/test';

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
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});