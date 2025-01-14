import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Chrome Extension', () => {

  test('extension should load without errors', async () => {
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    console.log('Loading extension from:', pathToExtension);
    
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    try {
      // Wait for and verify background page
      let extensionId: string | undefined;
      let backgroundPage;
      let retries = 0;
      while (!extensionId && retries < 5) {
        const backgroundPages = context.backgroundPages();
        backgroundPage = backgroundPages[0];
        extensionId = backgroundPage?.url()?.split('/')[2];
        if (!extensionId) {
          console.log('Waiting for background page, attempt:', retries + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }
      }
      expect(extensionId, 'Extension should have a valid ID').toBeTruthy();
      console.log('Extension loaded with ID:', extensionId);

      // Check for console errors/warnings in background page
      backgroundPage?.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Background console ${type}:`, text);
        // Fail test on errors
        if (type === 'error') {
          throw new Error(`Background script error: ${text}`);
        }
      });

      // Create a new page and navigate to the extension popup
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Listen for console messages in popup
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Popup console ${type}:`, text);
        // Fail test on errors
        if (type === 'error') {
          throw new Error(`Popup error: ${text}`);
        }
      });

      // Wait for React to mount and render
      await page.waitForSelector('#root');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/extension-popup.png',
        fullPage: true 
      });

      // Verify basic popup structure
      const root = await page.$('#root');
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