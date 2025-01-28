import { test, expect } from './utils/extension';
import path from 'path';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Chrome Extension', () => {
  test('extension functionality', async ({ context, extensionPopup: popup }) => {
    // 1. Take screenshot of initial state
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