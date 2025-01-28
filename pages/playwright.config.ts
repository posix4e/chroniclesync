import { defineConfig } from '@playwright/test';
import { paths } from './config';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    // Base URL for page tests, can be overridden in individual tests
    baseURL: process.env.API_URL || 'http://localhost:8787',
    screenshot: 'on',  // Always capture screenshots
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,  // Increase timeout for actions
    navigationTimeout: 30000,  // Increase timeout for navigation
    // Use persistent context for extension testing
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-automation',  // Required for extension testing
        '--allow-insecure-localhost',  // Allow local testing
        '--disable-background-timer-throttling',  // Prevent background throttling
        '--disable-backgrounding-occluded-windows',  // Keep background pages active
        '--disable-renderer-backgrounding',  // Keep renderers active
      ],
      timeout: 30000,  // Increase launch timeout
    },
  },
  projects: [
    {
      name: 'extension',
      testMatch: /extension\.spec\.ts/,
      use: {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',
            '--allow-insecure-localhost',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            `--disable-extensions-except=${paths.extensionDist}`,
            `--load-extension=${paths.extensionDist}`,
          ],
          timeout: 30000,
        },
        contextOptions: {
          reducedMotion: 'reduce',
          serviceWorkers: 'allow',
        },
      },
    },
    {
      name: 'pages',
      testMatch: /pages\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:53374',
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--allow-insecure-localhost',
          ],
        },
      },
    },
  ],
  forbidOnly: true,  // Always prevent .only tests
  workers: 1,  // Consistent, predictable test execution
  reporter: process.env.CI ? 'github' : 'list',  // Better output formatting for each environment
  globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:53374',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});