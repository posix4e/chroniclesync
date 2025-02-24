/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { paths } from '../../src/config';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    console.log('Starting browser context creation...');
    console.log('Extension path:', paths.extension);
    
    try {
      const context = await chromium.launchPersistentContext('', {
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

      console.log('Browser context created successfully');
      
      // Log browser and extension info
      const pages = context.pages();
      console.log(`Initial pages: ${pages.length}`);
      for (const page of pages) {
        console.log('Page URL:', page.url());
      }

      const workers = await context.serviceWorkers();
      console.log(`Service workers: ${workers.length}`);
      for (const worker of workers) {
        console.log('Worker URL:', worker.url());
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

      // Get extension ID from service worker
      console.log('Getting service workers...');
      const workers = await context.serviceWorkers();
      console.log(`Found ${workers.length} service workers`);
      
      for (const worker of workers) {
        console.log('Service worker URL:', worker.url());
      }

      const extensionId = workers.length ? 
        workers[0].url().split('/')[2] : 
        'unknown-extension-id';
      console.log('Extension ID:', extensionId);

      // Additional debugging: check background page
      const backgroundPages = context.backgroundPages();
      console.log(`Found ${backgroundPages.length} background pages`);
      for (const bgPage of backgroundPages) {
        console.log('Background page URL:', bgPage.url());
      }

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
  return `chrome-extension://${extensionId}/${path}`;
}

export class ExtensionTestHelper {
  private context: BrowserContext;
  private extensionId: string;

  private constructor(context: BrowserContext, extensionId: string) {
    this.context = context;
    this.extensionId = extensionId;
  }

  static async create(): Promise<ExtensionTestHelper> {
    const context = await chromium.launchPersistentContext('', {
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
      ]
    });

    // Wait for extension to load and get its ID
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(2000);

    const workers = await context.serviceWorkers();
    const extensionId = workers[0].url().split('/')[2];
    await page.close();

    return new ExtensionTestHelper(context, extensionId);
  }

  async close() {
    await this.context.close();
  }

  async openPopup() {
    const popup = await this.context.newPage();
    await popup.goto(getExtensionUrl(this.extensionId, 'popup.html'));
    return popup;
  }

  async waitForPopup(pageName: string) {
    // Click the "View History" button
    const popup = await this.openPopup();
    await popup.waitForLoadState('domcontentloaded');
    
    // Wait for the new window to open
    const newWindowPromise = this.context.waitForEvent('page');
    await popup.click('button:text("View History")');
    const newWindow = await newWindowPromise;
    
    // Wait for the page to load
    await newWindow.waitForLoadState('domcontentloaded');
    
    // Verify it's the correct page
    const url = newWindow.url();
    if (!url.includes(pageName)) {
      throw new Error(`Expected ${pageName} but got ${url}`);
    }
    
    await popup.close();
    return newWindow;
  }

  async addHistoryEntry(entry: { url: string; title: string; timestamp: number }) {
    // Send message to background script to add history entry
    const serviceWorker = (await this.context.serviceWorkers())[0];
    await serviceWorker.evaluate((entry) => {
      const historyStore = new (self as any).HistoryStore();
      return historyStore.init().then(() => {
        return historyStore.addEntry({
          visitId: Math.random().toString(36).substring(7),
          url: entry.url,
          title: entry.title,
          visitTime: entry.timestamp
        });
      });
    }, entry);
  }
}