import { test, expect } from '@playwright/test';
import { Page, BrowserContext } from '@playwright/test';

/**
 * Tests for client ID configuration and error handling
 */

async function setupExtensionPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto('chrome-extension://extension-id/popup.html');
  
  // Wait for the popup to load
  await page.waitForSelector('#root', { state: 'visible' });
  
  return page;
}

test.describe('Client ID Configuration', () => {
  test('should show error when client ID is configured in popup but not used in background', async ({ browser }) => {
    // Create a context for the extension
    const context = await browser.newContext();
    
    try {
      const page = await context.newPage();
      
      // Navigate to the extension popup
      await page.goto('http://localhost:12000/popup.html');
      
      // Wait for the popup to load
      await page.waitForSelector('#root', { state: 'visible' });
      
      // Set a client ID in the popup
      const testClientId = 'test-client-id-' + Date.now();
      await page.fill('#clientId', testClientId);
      
      // Click the initialize button
      await page.click('button:has-text("Initialize")');
      
      // Wait for the button to change to "Sync with Server"
      await page.waitForSelector('button:has-text("Sync with Server")');
      
      // Click the sync button to trigger the sync
      await page.click('button:has-text("Sync with Server")');
      
      // Wait for the error message to appear
      // This test will pass if we see the error message, which indicates the bug
      const errorMessage = await page.evaluate(() => {
        return new Promise<string>((resolve) => {
          // Listen for the syncError message from the background script
          chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'syncError') {
              resolve(message.error);
            }
          });
          
          // If no error after 5 seconds, resolve with empty string
          setTimeout(() => resolve(''), 5000);
        });
      });
      
      // Verify that the error message contains the expected text
      expect(errorMessage).toContain('Please configure your Client ID in the extension popup');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/client-id-error.png' });
    } finally {
      // Clean up
      await context.close();
    }
  });
});