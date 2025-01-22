import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../../extension');
    const userDataDir = path.join(__dirname, '../../../test-user-data');

    // Clean up user data directory
    if (fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to remove user data directory:', error);
      }
    }
    
    // Create user data directory
    fs.mkdirSync(userDataDir, { recursive: true });

    // Create a new browser context with the extension
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,  // Never use headless mode for extension testing
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
    });

    // Wait for the extension to be loaded
    console.log('Extension path:', pathToExtension);
    console.log('User data dir:', userDataDir);

    // Wait for the extension to be loaded
    let extensionLoaded = false;
    let extensionId = '';

    // Get the background page
    const backgroundPages = context.backgroundPages();
    if (backgroundPages.length === 0) {
      const page = await context.waitForEvent('backgroundpage');
      const url = page.url();
      extensionId = url.split('/')[2];
      extensionLoaded = true;
    } else {
      const url = backgroundPages[0].url();
      extensionId = url.split('/')[2];
      extensionLoaded = true;
    }

    if (!extensionLoaded || !extensionId) {
      await context.close();
      throw new Error('Extension failed to load');
    }

    // Try to load the extension's popup page
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for the popup to load
    try {
      await popupPage.waitForSelector('#root', { timeout: 5000 });
    } catch (error) {
      await context.close();
      throw new Error('Extension popup failed to load');
    }

    await popupPage.close();

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Get the extension ID from the user data directory
    const userDataDir = path.join(__dirname, '../../../test-user-data');
    const extensionsDir = path.join(userDataDir, 'Default', 'Extensions');
    
    if (!fs.existsSync(extensionsDir)) {
      throw new Error('Extensions directory not found');
    }

    const extensions = fs.readdirSync(extensionsDir);
    if (extensions.length === 0) {
      throw new Error('No extensions found');
    }

    const extensionId = extensions[0];
    await use(extensionId);
  },
});

export const expect = test.expect;