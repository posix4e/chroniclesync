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
      ],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);

    const workers = await context.serviceWorkers();
    const extensionId = workers[0].url().split('/')[2];
    await page.close();

    return new ExtensionTestHelper(context, extensionId);
  }

  async cleanup() {
    await this.context.close();
  }

  async openPopup() {
    const popup = await this.context.newPage();
    await popup.goto(getExtensionUrl(this.extensionId, 'popup.html'));
    return popup;
  }

  async openHistoryPopout() {
    const popup = await this.openPopup();
    await popup.click('text=View History');
    const historyWindow = await this.waitForPopup('history.html');
    await popup.close();
    return historyWindow;
  }

  async waitForPopup(path: string) {
    const expectedUrl = getExtensionUrl(this.extensionId, path);
    let targetPage = null;

    while (!targetPage) {
      const pages = this.context.pages();
      targetPage = pages.find(page => page.url() === expectedUrl);
      if (!targetPage) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return targetPage;
  }

  async addTestHistoryEntries(entries: Array<{ url: string; title: string; timestamp: number }>) {
    const page = await this.context.newPage();
    await page.evaluate((testEntries) => {
      const historyStore = new (window as any).HistoryStore();
      testEntries.forEach(entry => {
        historyStore.addEntry({
          url: entry.url,
          title: entry.title,
          timestamp: entry.timestamp,
          syncStatus: 'synced'
        });
      });
    }, entries);
    await page.close();
  }
}