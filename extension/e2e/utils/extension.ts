/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, webkit, type BrowserContext } from '@playwright/test';
import { paths } from '../../src/config';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

// Check if we're running in the webkit-ios-simulator project
const isWebkitIOS = process.env.BROWSER?.includes('webkit-ios') || false;

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    console.log('Starting browser context creation...');
    console.log('Extension path:', paths.extension);
    console.log('Browser type:', process.env.BROWSER || 'chromium');
    
    try {
      let context;
      
      // For iOS Safari tests, use webkit instead of chromium
      if (isWebkitIOS) {
        console.log('Creating WebKit context for iOS Safari testing...');
        context = await webkit.launch({
          headless: true
        }).then(browser => browser.newContext({
          isMobile: true,
          deviceScaleFactor: 2,
          hasTouch: true,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
          viewport: { width: 390, height: 844 },
        }));
        
        console.log('WebKit iOS context created successfully');
      } else {
        // Regular chromium context for other tests
        context = await chromium.launchPersistentContext('', {
          headless: false,
          args: [
            `--disable-extensions-except=${paths.extension}`,
            `--load-extension=${paths.extension}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-logging=stderr',
            '--v=1',
            '--allow-insecure-localhost',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          logger: {
            isEnabled: () => true,
            log: (name, severity, message) => console.log(`[${severity}] ${name}: ${message}`),
          },
        });
        
        console.log('Chromium context created successfully');
      }

      // Log browser and extension info
      const pages = context.pages();
      console.log(`Initial pages: ${pages.length}`);
      for (const page of pages) {
        console.log('Page URL:', page.url());
      }

      // Only check service workers for chromium (not available in webkit)
      if (!isWebkitIOS) {
        const workers = await context.serviceWorkers();
        console.log(`Service workers: ${workers.length}`);
        for (const worker of workers) {
          console.log('Worker URL:', worker.url());
        }
      }

      await use(context);
      
      console.log('Test completed, closing context...');
      await context.close();
      console.log('Context closed successfully');
    } catch (error) {
      console.error('Error in browser context:', error);
      throw error;
    }
  },
  extensionId: async ({ context }, use) => {
    console.log('Getting extension ID...');
    try {
      // Open a page to trigger extension loading
      console.log('Opening new page...');
      const page = await context.newPage();
      
      console.log('Navigating to example.com...');
      await page.goto('https://example.com');
      
      console.log('Waiting for extension to load...');
      await page.waitForTimeout(2000); // Increased timeout

      let extensionId = 'unknown-extension-id';
      
      // For iOS Safari, we don't have real extension IDs
      if (isWebkitIOS) {
        console.log('Using simulated extension ID for iOS Safari');
        extensionId = 'ios-safari-extension';
      } else {
        // Get extension ID from service worker for chromium
        console.log('Getting service workers...');
        const workers = await context.serviceWorkers();
        console.log(`Found ${workers.length} service workers`);
        
        for (const worker of workers) {
          console.log('Service worker URL:', worker.url());
        }

        extensionId = workers.length ? 
          workers[0].url().split('/')[2] : 
          'unknown-extension-id';
          
        // Additional debugging: check background page
        const backgroundPages = context.backgroundPages();
        console.log(`Found ${backgroundPages.length} background pages`);
        for (const bgPage of backgroundPages) {
          console.log('Background page URL:', bgPage.url());
        }
      }
      
      console.log('Extension ID:', extensionId);
      await use(extensionId);
      
      console.log('Closing test page...');
      await page.close();
      console.log('Test page closed');
    } catch (error) {
      console.error('Error getting extension ID:', error);
      throw error;
    }
  },
});

export const expect = test.expect;

export function getExtensionUrl(extensionId: string, path: string) {
  // For iOS Safari, we use a different URL format
  if (isWebkitIOS) {
    return `about:blank#${path}`; // Simulated extension URL for iOS
  }
  return `chrome-extension://${extensionId}/${path}`;
}