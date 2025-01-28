import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { paths } from '../../config';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${paths.extension}`,
        `--load-extension=${paths.extension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Open a page to trigger extension loading
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);

    // Get extension ID from service worker
    const workers = await context.serviceWorkers();
    const extensionId = workers.length ? 
      workers[0].url().split('/')[2] : 
      'unknown-extension-id';

    await use(extensionId);
    await page.close();
  },
});

export const expect = test.expect;