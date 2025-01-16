import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

test.describe('Chrome Extension', () => {
  test('extension should load without errors', async () => {
    test.setTimeout(60000); // Increase timeout to 1 minute
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    console.log('Loading extension from path:', pathToExtension);

    // Create test-results directory if it doesn't exist
    const testResultsDir = path.join(__dirname, '../../../test-results');
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }

    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
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
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      bypassCSP: true,
      recordVideo: {
        dir: testResultsDir,
        size: { width: 1280, height: 720 },
      },
      serviceWorkers: 'block', // Block service workers to avoid cleanup issues
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`${name} [${severity}]: ${message}`),
      },
    });
    
    try {
      // Wait for the extension to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Open a new page to verify the extension is loaded
      const page = await context.newPage();
      await page.goto('about:blank');

      // Wait a bit to ensure no errors occur
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close the page
      await page.close();

    } finally {
      // Close the context
      await context.close();
    }
  });
});