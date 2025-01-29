import { defineConfig } from '@playwright/test';
import { server } from './config';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
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
      name: 'chromium',
      use: {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-automation',  // Required for extension testing
            '--allow-insecure-localhost',  // Allow local testing
            '--disable-background-timer-throttling',  // Prevent background throttling
            '--disable-backgrounding-occluded-windows',  // Keep background pages active
            '--disable-renderer-backgrounding',  // Keep renderers active
            `--disable-extensions-except=${paths.extensionDist}`,
            `--load-extension=${paths.extensionDist}`,
          ],
          timeout: 30000,  // Increase launch timeout
        },
        contextOptions: {
          reducedMotion: 'reduce',  // Reduce animations
          serviceWorkers: 'allow',  // Explicitly allow service workers
        },
      },
    },
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'npm run dev',
    port: Number(new URL(server.webUrl).port),
    reuseExistingServer: !process.env.CI,
  },
});