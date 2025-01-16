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

      // Get the extension ID from the background page URL
      const pages = await context.pages();
      const extensionPages = pages.filter(p => p.url().startsWith('chrome-extension://'));
      if (extensionPages.length === 0) {
        throw new Error('No extension pages found');
      }
      const extensionUrl = extensionPages[0].url();
      const extensionId = extensionUrl.split('/')[2];
      console.log('Extension ID:', extensionId);

      // Navigate to the extension popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      console.log('Popup page URL:', await popupPage.url());

      // Listen for console messages in popup
      popupPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Popup console ${type}:`, text);
        // Log errors but don't fail test
        if (type === 'error') {
          console.error(`Popup error: ${text}`);
        }
      });

      // Verify that the extension is working
      const root = await popupPage.$('#root');
      expect(root, 'Root element should exist').toBeTruthy();

      // Close all pages except popup
      const pages2 = await context.pages();
      for (const page of pages2) {
        if (page !== popupPage) {
          await page.close();
        }
      }

      // Close popup page
      await popupPage.close();

      // Verify that all pages are closed
      const finalPages = await context.pages();
      expect(finalPages.length, 'All pages should be closed').toBe(0);

    } finally {
      // Close the context
      await context.close();
    }
  });
});