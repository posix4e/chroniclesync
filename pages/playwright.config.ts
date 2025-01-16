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
  testMatch: process.env.TEST_TYPE === 'extension' ? '**/extension.spec.ts' : '**/home.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    serviceWorkers: 'allow', // Allow service workers for extension tests
    launchOptions: {
      slowMo: 100,
      timeout: 30000,
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
              '--disable-gpu',
              '--disable-software-rasterizer',
              '--disable-background-networking',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-breakpad',
              '--disable-client-side-phishing-detection',
              '--disable-component-extensions-with-background-pages',
              '--disable-default-apps',
              '--disable-features=TranslateUI',
              '--disable-hang-monitor',
              '--disable-ipc-flooding-protection',
              '--disable-popup-blocking',
              '--disable-prompt-on-repost',
              '--disable-renderer-backgrounding',
              '--disable-sync',
              '--force-color-profile=srgb',
              '--metrics-recording-only',
              '--no-first-run',
              '--password-store=basic',
              '--use-mock-keychain',
              '--enable-logging',
              '--v=1',
              '--enable-automation',
              '--remote-debugging-port=0',
              '--disable-web-security',
              '--allow-insecure-localhost',
              '--allow-running-insecure-content',
              '--enable-features=NetworkService,NetworkServiceInProcess',
              '--enable-logging=stderr',
              '--log-level=0',
            ],
            slowMo: 100,
            timeout: 30000,
          },
        } : {}),
      },
    },
  ],
  outputDir: 'test-results',
});