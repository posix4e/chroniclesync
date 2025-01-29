import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { paths } from '../../src/config';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async (_obj, testInfo) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${paths.extension}`,
        `--load-extension=${paths.extension}`,
      ],
    });
    testInfo.context = context;
    await context.close();
  },
  extensionId: async ({ context }, testInfo) => {
    // Open a page to trigger extension loading
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);

    // Get extension ID from service worker
    const workers = await context.serviceWorkers();
    const extensionId = workers.length ? 
      workers[0].url().split('/')[2] : 
      'unknown-extension-id';

    testInfo.extensionId = extensionId;
    await page.close();
  },
});

export const expect = test.expect;

export function getExtensionUrl(extensionId: string, path: string) {
  return `chrome-extension://${extensionId}/${path}`;
}