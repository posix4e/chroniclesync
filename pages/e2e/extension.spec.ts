import { test, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

/**
 * Helper function to get the extension popup page
 */
async function getExtensionPopup(context: BrowserContext): Promise<{ extensionId: string, popup: Page }> {
  // Wait for service worker to be registered (up to 5 seconds)
  let worker = null;
  for (let i = 0; i < 3; i++) {
    const workers = context.serviceWorkers();
    console.log(`Attempt ${i + 1}/3: Service workers:`, workers.map(w => w.url()));
    
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
    await expect(popup.locator('text=Last sync: Never')).toBeVisible();
    await expect(popup.locator('text=Status: idle')).toBeVisible();
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
    
    // Take screenshot after history generation
    await popup.screenshot({ 
      path: path.join('test-results', '02-after-history.png'),
      fullPage: true 
    });
    
    // 4. Test Sync Functionality
    console.log('Testing sync functionality...');
    const syncButton = popup.locator('button:has-text("Sync Now")');
    await syncButton.click();
    
    // Wait for sync to complete (button should be re-enabled)
    await popup.waitForSelector('button:has-text("Sync Now"):not([disabled])', { 
      timeout: 5000 
    });
    
    // Take final screenshot
    await popup.screenshot({ 
      path: path.join('test-results', '03-after-sync.png'),
      fullPage: true 
    });
    
    // 5. Verify Sync Status
    await expect(popup.locator('text=Status: idle')).toBeVisible();
    const lastSyncText = await popup.locator('text=Last sync:').textContent();
    expect(lastSyncText).toBeTruthy();
    expect(lastSyncText).not.toContain('Never');
  });
});