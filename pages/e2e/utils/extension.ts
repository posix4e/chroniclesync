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

    // Wait for service worker to be registered
    await new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 10000; // 10 seconds timeout

      const checkWorker = () => {
        const workers = context.serviceWorkers();
        if (workers.length > 0) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for service worker to be registered'));
        } else {
          setTimeout(checkWorker, 100);
        }
      };
      checkWorker();
    });

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Get the extension ID from the background service worker URL
    let extensionId = 'unknown-extension-id';
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      const backgroundUrl = workers[0].url();
      const match = backgroundUrl.match(/chrome-extension:\/\/([^/]+)/);
      if (match) {
        extensionId = match[1];
      }
    }
    await use(extensionId);
  },
});

export const expect = test.expect;