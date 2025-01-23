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
    let attempts = 0;
    const maxAttempts = 3;
    let extensionId = 'unknown-extension-id';

    while (attempts < maxAttempts) {
      const backgroundPages = context.backgroundPages();
      if (backgroundPages.length) {
        const url = backgroundPages[0].url();
        const match = url.match(/chrome-extension:\/\/([a-p]{32})/);
        if (match && match[1]) {
          extensionId = match[1];
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (extensionId === 'unknown-extension-id') {
      throw new Error('Failed to detect extension ID after multiple attempts');
    }
    
    await use(extensionId);
  },
});

export const expect = test.expect;