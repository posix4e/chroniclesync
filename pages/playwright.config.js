const { defineConfig, devices } = require('@playwright/test');
const { MockWorkerServer } = require('./e2e/mockServer');

// Create mock server instance
const mockServer = new MockWorkerServer(8787);

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
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:8788',
      reuseExistingServer: !process.env.CI,
      env: {
        WORKER_URL: 'http://localhost:8787',
      },
    },
    {
      command: async () => {
        await mockServer.start();
        return async () => {
          await mockServer.stop();
        };
      },
      url: 'http://localhost:8787',
      reuseExistingServer: !process.env.CI,
    },
  ],
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
});