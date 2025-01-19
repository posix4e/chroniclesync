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
    // Get the extension ID from the extension path
    const pathToExtension = path.join(__dirname, '../../../extension');
    const manifestPath = path.join(pathToExtension, 'manifest.json');
    const manifest = require(manifestPath);
    const extensionId = manifest.key || 'test-extension-id';
    process.env.EXTENSION_ID = extensionId;
    await use(extensionId);
  },
});

export const expect = test.expect;