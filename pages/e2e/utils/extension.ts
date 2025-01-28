import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import { paths } from '../../config';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  extensionPopup: Page;
};

/**
 * Helper function to get the extension popup page
 */
async function getExtensionPopup(context: BrowserContext): Promise<{ extensionId: string, popup: Page }> {
  // Wait for service worker to be registered (up to 5 seconds)
  let worker = null;
  for (let i = 0; i < 3; i++) {
    const workers = context.serviceWorkers();
    worker = workers.find(w => w.url().includes('background'));
    if (worker) break;
    
    // Wait ~1.7s between attempts (total ~5s with 3 tries)
    await new Promise(resolve => setTimeout(resolve, 1700));
  }
  
  if (!worker) {
    throw new Error('Extension service worker not found after 3 attempts (5 seconds)');
  }
  
  // Extract extension ID from service worker URL
  const extensionId = worker.url().split('/')[2];
  
  // Create and return the popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForLoadState('domcontentloaded');
  
  return { extensionId, popup };
}

export const test = base.extend<TestFixtures>({
  context: async (_, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${paths.extension}`,
        `--load-extension=${paths.extension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    // Wait for extension to be ready
    let ready = false;
    for (let i = 0; i < 10; i++) {
      const workers = context.serviceWorkers();
      if (workers.some(w => w.url().includes('background'))) {
        ready = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!ready) {
      throw new Error('Extension not ready after 5 seconds');
    }

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const { extensionId } = await getExtensionPopup(context);
    await use(extensionId);
  },
  extensionPopup: async ({ context }, use) => {
    const { popup } = await getExtensionPopup(context);
    await use(popup);
    await popup.close();
  },
});

export const expect = test.expect;