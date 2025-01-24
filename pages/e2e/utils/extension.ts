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
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-insecure-localhost',
        '--disable-web-security'
      ],
    });
    await context.grantPermissions(['tabs']);
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const backgroundPages = context.backgroundPages();
    const extensionId = backgroundPages.length ? 
      backgroundPages[0].url().split('/')[2] : 
      'unknown-extension-id';
    
    await use(extensionId);
  },
});

export const expect = test.expect;