import { test, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

/**
 * Helper function to get the extension popup page
 */
async function getExtensionPopup(context: BrowserContext): Promise<{ extensionId: string, popup: Page }> {
  // Get the background page
  const backgroundPages = context.backgroundPages();
  console.log('Background pages:', backgroundPages.map(p => p.url()));
  
  // Find our extension's background page
  const backgroundPage = backgroundPages.find(p => p.url().includes('background'));
  if (!backgroundPage) {
    throw new Error('Extension background page not found');
  }
  
  // Extract extension ID from background page URL
  const extensionId = backgroundPage.url().split('/')[2];
  console.log('Found extension ID:', extensionId);
  
  // Create and return the popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForLoadState('domcontentloaded');
  
  return { extensionId, popup };
}

test.describe('Chrome Extension', () => {
  test('extension functionality', async ({ context }) => {
    // 1. Initial Setup and Screenshots
    console.log('Test started with browser context:', context.constructor.name);
    
    // Get the extension popup
    const { extensionId, popup } = await getExtensionPopup(context);
    console.log('Extension loaded with ID:', extensionId);
    
    // Take screenshot of initial state
    await popup.screenshot({ 
      path: path.join('test-results', '01-initial-popup.png'),
      fullPage: true 
    });
    
    // 2. Verify Initial UI State
    await expect(popup.locator('h2')).toHaveText('ChronicleSync');
    await expect(popup.locator('#clientId')).toBeVisible();
    await expect(popup.locator('button:has-text("Sync Now")')).toBeVisible();
    
    // 3. Generate Test History
    console.log('Generating test history entries...');
    const testPages = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ];
    
    for (const url of testPages) {
      const page = await context.newPage();
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      await page.close();
    }
    
    // 4. Initialize Client
    console.log('Initializing client...');
    await popup.fill('#clientId', 'test-client');
    await popup.click('button:has-text("Initialize")');
    
    // Take screenshot after initialization
    await popup.screenshot({ 
      path: path.join('test-results', '02-after-initialization.png'),
      fullPage: true 
    });
    
    // 5. Verify History Display
    console.log('Verifying history entries...');
    await popup.waitForSelector('.history-entry');
    const entries = await popup.locator('.history-entry').all();
    expect(entries.length).toBeGreaterThanOrEqual(testPages.length);
    
    // Take screenshot of history entries
    await popup.screenshot({ 
      path: path.join('test-results', '03-history-entries.png'),
      fullPage: true 
    });
    
    // 6. Test Sync Functionality
    console.log('Testing sync functionality...');
    const syncButton = popup.locator('button:has-text("Sync Now")');
    await syncButton.click();
    
    // Wait for sync to complete (button should be re-enabled)
    await popup.waitForSelector('button:has-text("Sync Now"):not([disabled])', { 
      timeout: 5000 
    });
    
    // Take final screenshot
    await popup.screenshot({ 
      path: path.join('test-results', '04-after-sync.png'),
      fullPage: true 
    });
    
    // 7. Verify Sync Status
    const lastSync = await popup.locator('.sync-status').textContent();
    expect(lastSync).toContain('Last sync:');
    expect(lastSync).not.toContain('Never');
  });
});