import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../../extension');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Get the extension ID from the service worker
    const targets = context.serviceWorkers();
    if (!targets.length) {
      // If no service worker, try to get ID from extension URL
      const [page] = await Promise.all([
        context.newPage(),
        context.waitForEvent('serviceworker')
      ]);
      await page.goto('chrome://extensions');
    }
    const targets2 = context.serviceWorkers();
    const extensionId = targets2.length ? 
      targets2[0].url().split('/')[2] : 
      'unknown-extension-id';
    
    await use(extensionId);
  },
});

export const expect = test.expect;