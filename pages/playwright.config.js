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
    // Fast but reasonable timeouts
    actionTimeout: 2000,
    navigationTimeout: 2000,
    // Wait for page load
    waitForNavigation: 'domcontentloaded',
  },
  
  // Fast test timeout
  timeout: 5000,
  
  // Expect faster assertions
  expect: {
    timeout: 2000,
  },

  globalSetup: require.resolve('./e2e/setup.js'),
  globalTeardown: require.resolve('./e2e/teardown.js'),
});