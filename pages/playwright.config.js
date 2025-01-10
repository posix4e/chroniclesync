const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Disable parallel execution to prevent data conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retry for local testing too
  workers: 1, // Force single worker
  reporter: [
    ['html'],
    ['list'] // Add list reporter for better console output
  ],
  timeout: 45000, // 45 second timeout for each test
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://api-staging.chroniclesync.xyz',
    trace: 'retain-on-failure', // Keep traces for failed tests
    actionTimeout: 15000, // 15 second timeout for actions
    video: 'retain-on-failure', // Record video for failed tests
    screenshot: 'only-on-failure', // Take screenshots only on failure
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

});