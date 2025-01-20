import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async ({ }, use) => { // eslint-disable-line no-empty-pattern, @typescript-eslint/no-empty-object-type
    const pathToExtension = path.join(__dirname, '../../../extension');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      viewport: { width: 1280, height: 720 }
    });

    // Wait for the extension to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Get the extension ID from the background page URL
    const backgroundPages = context.backgroundPages();
    const extensionId = backgroundPages.length ? 
      backgroundPages[0].url().split('/')[2] : 
      'unknown-extension-id';
    
    await use(extensionId);
  },
});

export const expect = test.expect;