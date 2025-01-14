import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

test.describe('Chrome Extension', () => {

  test('extension should load without errors', async () => {
    test.setTimeout(60000); // Increase timeout to 1 minute
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    console.log('Loading extension from path:', pathToExtension);
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
        '--enable-background-networking',
        '--enable-features=ServiceWorker',
        '--enable-background-mode',
        '--enable-background-thread-pool',
      ],
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      bypassCSP: true,
      recordVideo: {
        dir: 'test-results',
        size: { width: 1280, height: 720 },
      },
      serviceWorkers: 'allow',
      permissions: ['background-sync'],
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`${name} [${severity}]: ${message}`),
      },
    });
    
    // Wait for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a new page to trigger service worker registration
    const page = await context.newPage();
    await page.goto('about:blank');
    await page.evaluate(() => {
      // Force service worker registration
      if ('serviceWorker' in navigator) {
        console.log('Registering service worker...');
        navigator.serviceWorker.register('/service-worker.js').then(
          registration => console.log('Service worker registered:', registration),
          error => console.error('Service worker registration failed:', error)
        );
      } else {
        console.log('Service workers not supported');
      }
    });
    await page.close();
    
    // Log the current state
    console.log('Current pages:', context.pages().map(p => p.url()));
    console.log('Current service workers:', context.serviceWorkers().map(w => w.url()));

    try {
      // Wait for the service worker to be available
      let extensionId: string | undefined;
      let retries = 0;
      while (!extensionId && retries < 3) {
        const workers = context.serviceWorkers();
        console.log('Service workers:', workers.map(w => w.url()));
        
        // Log worker URLs for debugging
        workers.forEach(worker => {
          console.log('Service worker URL:', worker.url());
        });
        
        // Try to get extension ID from service workers first
        extensionId = workers[0]?.url()?.split('/')[2];
        
        // If no service worker found, try to get extension ID from background page
        if (!extensionId) {
          const pages = context.pages();
          console.log('Pages:', pages.map(p => p.url()));
          const backgroundPage = pages.find(p => p.url().startsWith('chrome-extension://'));
          if (backgroundPage) {
            extensionId = backgroundPage.url().split('/')[2];
          }
        }
        
        if (!extensionId) {
          console.log('Waiting for service worker or background page, attempt:', retries + 1);
          console.log('Extension context:', {
            pages: context.pages().length,
            serviceWorkers: workers.length
          });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between retries
          retries++;
        }
      }
      
      if (!extensionId) {
        throw new Error('Could not find extension ID from background pages after retries');
      }
      
      expect(extensionId, 'Extension should have a valid ID').toBeTruthy();
      console.log('Extension loaded with ID:', extensionId);

      // We can't directly monitor service worker logs in Playwright
      // but we can check if the extension is working by accessing the popup

      // Navigate to the extension popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Listen for console messages in popup
      popupPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Popup console ${type}:`, text);
        // Fail test on errors
        if (type === 'error') {
          throw new Error(`Popup error: ${text}`);
        }
      });

      // Wait for React to mount and render
      await popupPage.waitForSelector('#root');
      
      // Ensure test-results directory exists
      const testResultsDir = path.join(__dirname, '../../../test-results');
      if (!existsSync(testResultsDir)) {
        mkdirSync(testResultsDir, { recursive: true });
      }

      // Take screenshot for debugging
      await popupPage.screenshot({ 
        path: path.join(testResultsDir, 'extension-popup.png'),
        fullPage: true 
      });

      // Verify basic popup structure
      const root = await popupPage.$('#root');
      expect(root, 'Root element should exist').toBeTruthy();

      // TODO: Add more specific UI checks once the popup interface is defined
      // For example:
      // await expect(page.getByRole('heading')).toBeVisible();
      // await expect(page.getByRole('button')).toBeEnabled();

    } finally {
      await context.close();
    }
  });
});