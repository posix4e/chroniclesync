import { defineConfig } from '@playwright/test';
import { paths } from './config';

// Determine if running in CI
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: false, // Never run headless, use xvfb in CI instead
    baseURL: process.env.API_URL || 'http://localhost:8787',
    screenshot: 'on',
    trace: isCI ? 'retain-on-failure' : 'off',
    video: isCI ? 'retain-on-failure' : 'off',
    navigationTimeout: 10000,
    actionTimeout: 5000,
  },
  timeout: 30000,
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-first-run',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
            '--disable-gpu',
            '--use-gl=swiftshader',
            '--use-angle=swiftshader',
            `--disable-extensions-except=${paths.extension}`,
            `--load-extension=${paths.extension}`,
          ],
          timeout: 10000,
          ignoreDefaultArgs: ['--enable-automation'],
        },
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  forbidOnly: true,
  workers: 1,
  reporter: isCI ? 'github' : 'list',
  globalSetup: './e2e/global-setup.ts',
  retries: isCI ? 2 : 0,
  globalTimeout: 60000,
});