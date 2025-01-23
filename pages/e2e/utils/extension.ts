import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async (_params, use) => {
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
    // Create a page to get the extension ID
    const page = await context.newPage();
    
    // Inject a script to get the extension ID
    const extensionId = await page.evaluate(async () => {
      // Find our extension by manifest properties
      const extensions = await chrome.management.getAll();
      const ourExtension = extensions.find(ext => 
        ext.name === 'ChronicleSync Extension' && 
        ext.installType === 'development'
      );
      return ourExtension?.id || 'unknown-extension-id';
    });

    await page.close();
    await use(extensionId);
  },
});

export const expect = test.expect;