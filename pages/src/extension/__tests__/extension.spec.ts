import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Chrome Extension', () => {

  test('extension should load without errors', async () => {
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    console.log('Loading extension from path:', pathToExtension);
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    
    // Wait a bit for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Wait for the background page to be available
      let extensionId: string | undefined;
      let retries = 0;
      while (!extensionId && retries < 10) {
        const backgroundPages = context.backgroundPages();
        console.log('Background pages:', backgroundPages.map(p => p.url()));
        
        extensionId = backgroundPages[0]?.url()?.split('/')[2];
        if (!extensionId) {
          console.log('Waiting for background page, attempt:', retries + 1);
          console.log('Extension context:', {
            pages: context.pages().length,
            backgroundPages: backgroundPages.length,
            serviceWorkers: context.serviceWorkers().length
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }
      }
      
      if (!extensionId) {
        throw new Error('Could not find extension ID from background pages after retries');
      }
      
      expect(extensionId, 'Extension should have a valid ID').toBeTruthy();
      console.log('Extension loaded with ID:', extensionId);

      // We can't directly monitor service worker logs in Playwright
      // but we can check if the extension is working by accessing the popup

      // Navigate to the extension popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Listen for console messages in popup
      popupPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Popup console ${type}:`, text);
        // Fail test on errors
        if (type === 'error') {
          throw new Error(`Popup error: ${text}`);
        }
      });

      // Wait for React to mount and render
      await popupPage.waitForSelector('#root');
      
      // Take screenshot for debugging
      await popupPage.screenshot({ 
        path: 'test-results/extension-popup.png',
        fullPage: true 
      });

      // Verify basic popup structure
      const root = await popupPage.$('#root');
      expect(root, 'Root element should exist').toBeTruthy();

      // TODO: Add more specific UI checks once the popup interface is defined
      // For example:
      // await expect(page.getByRole('heading')).toBeVisible();
      // await expect(page.getByRole('button')).toBeEnabled();

    } finally {
      await context.close();
    }
  });
});