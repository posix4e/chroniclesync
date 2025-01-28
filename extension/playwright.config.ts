import { PlaywrightTestConfig } from '@playwright/test';
import { server } from '../pages/config';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: server.webUrl,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'cd ../pages && npm run dev',
    port: Number(new URL(server.webUrl).port),
    reuseExistingServer: !process.env.CI,
  },
}

export default config;