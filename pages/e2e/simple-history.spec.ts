import { test, expect } from './utils/extension';
import * as path from 'path';
import * as fs from 'fs';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-results', 'browser-history');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Simple History Sync', () => {
  test('should record and sync browser history', async ({ context, extensionId }) => {
    // Create two browser instances
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Load extension in both browsers
    await Promise.all([
      page1.goto(`chrome-extension://${extensionId}/popup.html`),
      page2.goto(`chrome-extension://${extensionId}/popup.html`)
    ]);

    // Wait for extension initialization
    await Promise.all([
      page1.waitForSelector('[data-testid="history-container"]'),
      page2.waitForSelector('[data-testid="history-container"]')
    ]);

    // Navigate in first browser
    await page1.goto('https://example.com');
    await page1.waitForTimeout(1000);

    // Verify history is recorded
    const entries1 = await page1.$$('[data-testid="history-entry"]');
    expect(entries1).toHaveLength(1);

    // Take screenshot of first browser
    await page1.screenshot({
      path: path.join(screenshotsDir, 'browser1-history.png')
    });

    // Wait for sync and verify in second browser
    await page2.waitForTimeout(5000);
    const entries2 = await page2.$$('[data-testid="history-entry"]');
    expect(entries2).toHaveLength(1);

    // Take screenshot of second browser
    await page2.screenshot({
      path: path.join(screenshotsDir, 'browser2-history.png')
    });

    // Verify entry details
    const url1 = await page1.textContent('[data-testid="history-url"]');
    const url2 = await page2.textContent('[data-testid="history-url"]');
    expect(url1).toBe('https://example.com');
    expect(url2).toBe('https://example.com');
  });

  test('should handle offline mode', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('[data-testid="history-container"]');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Navigate while offline
    await page.goto('https://example.org');
    await page.waitForTimeout(1000);

    // Verify entry is recorded but not synced
    const entries = await page.$$('[data-testid="history-entry"]');
    expect(entries).toHaveLength(1);
    
    const entryClasses = await page.$eval(
      '[data-testid="history-entry"]',
      el => el.className
    );
    expect(entryClasses).toContain('pending');

    // Take screenshot of offline state
    await page.screenshot({
      path: path.join(screenshotsDir, 'offline-history.png')
    });

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(5000);

    // Verify entry is now synced
    const syncedClasses = await page.$eval(
      '[data-testid="history-entry"]',
      el => el.className
    );
    expect(syncedClasses).toContain('synced');

    // Take screenshot of synced state
    await page.screenshot({
      path: path.join(screenshotsDir, 'synced-history.png')
    });
  });
});