const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:8788',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'on-first-retry',
    // Shorter timeouts for faster feedback
    actionTimeout: 5000,
    navigationTimeout: 5000,
    // Wait for page load
    waitForNavigation: 'networkidle',
  },
  
  // Shorter test timeout
  timeout: 10000,

  globalSetup: require.resolve('./e2e/setup.js'),
  globalTeardown: require.resolve('./e2e/teardown.js'),
});