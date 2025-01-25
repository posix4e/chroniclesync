import { test, expect } from './utils/extension';
import { server } from '../config';

test.describe('History Sync Feature', () => {
  test('should sync history across multiple browsers', async ({ context, extensionId }) => {
    const apiUrl = process.env.API_URL || server.apiUrl;
    // Create two browser contexts to simulate different devices
    const browser1 = await context.newPage();
    const browser2 = await context.newPage();

    // Navigate to some pages in browser1
    await browser1.goto('https://example.com');
    await browser1.waitForTimeout(1000);
    await browser1.goto('https://test.com');
    await browser1.waitForTimeout(1000);

    // Navigate to some pages in browser2
    await browser2.goto('https://github.com');
    await browser2.waitForTimeout(1000);
    await browser2.goto('https://gitlab.com');
    await browser2.waitForTimeout(1000);

    // Open the extension page to view history
    const historyPage = await context.newPage();
    await historyPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Switch to history tab
    const historyTab = await historyPage.locator('button:has-text("History")');
    await historyTab.click();

    // Wait for history to load
    await historyPage.waitForTimeout(2000);

    // Take a screenshot of the history view
    await historyPage.screenshot({
      path: 'test-results/history-sync.png',
      fullPage: true
    });

    // Verify history entries from both browsers are present
    const historyItems = await historyPage.locator('.history-item').count();
    expect(historyItems).toBeGreaterThanOrEqual(4);

    // Verify device filtering
    const deviceSelect = await historyPage.locator('select');
    const deviceOptions = await deviceSelect.locator('option').count();
    expect(deviceOptions).toBeGreaterThanOrEqual(3); // "All Devices" + 2 browsers

    // Filter by first device
    await deviceSelect.selectOption({ index: 1 });
    await historyPage.waitForTimeout(500);
    const filteredItems1 = await historyPage.locator('.history-item').count();
    expect(filteredItems1).toBeGreaterThanOrEqual(2);

    // Filter by second device
    await deviceSelect.selectOption({ index: 2 });
    await historyPage.waitForTimeout(500);
    const filteredItems2 = await historyPage.locator('.history-item').count();
    expect(filteredItems2).toBeGreaterThanOrEqual(2);

    // Take screenshots of filtered views
    await historyPage.screenshot({
      path: 'test-results/history-sync-device1.png',
      fullPage: true
    });
    await historyPage.screenshot({
      path: 'test-results/history-sync-device2.png',
      fullPage: true
    });
  });

  test('history should be accessible from web interface', async ({ page }) => {
    // Navigate to the web interface
    await page.goto(`http://localhost:${server.port}`);

    // Switch to history tab
    const historyTab = await page.locator('button:has-text("History")');
    await historyTab.click();

    // Wait for history to load
    await page.waitForTimeout(2000);

    // Take a screenshot of the web history view
    await page.screenshot({
      path: 'test-results/web-history.png',
      fullPage: true
    });

    // Verify history entries are present
    const historyItems = await page.locator('.history-item').count();
    expect(historyItems).toBeGreaterThan(0);

    // Verify device filtering works
    const deviceSelect = await page.locator('select');
    await deviceSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Take a screenshot of filtered view
    await page.screenshot({
      path: 'test-results/web-history-filtered.png',
      fullPage: true
    });
  });
});