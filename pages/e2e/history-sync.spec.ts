import { test, expect } from '@playwright/test';
import { loadExtension } from './utils/extension';

test.describe('History Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Verify API endpoint is accessible
    const apiUrl = process.env.API_URL || 'http://localhost:8787';
    const response = await page.request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.healthy).toBeTruthy();
  });
  test('should sync history across tabs', async ({ context }) => {
    // Load extension in first window
    const extensionId = await loadExtension(context);
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(extensionUrl);

    // Take screenshot of initial state
    await popup.screenshot({ path: 'test-results/history-sync-initial.png' });

    // Navigate to a test page in a new tab
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    // Wait for history to sync and check popup
    await popup.reload();
    await popup.waitForSelector('.history-list');

    // Verify history item is present
    const historyItem = popup.locator('.history-item').first();
    await expect(historyItem.locator('a')).toHaveAttribute('href', 'https://example.com');
    await expect(historyItem.locator('.device-name')).toBeVisible();
    await expect(historyItem.locator('.device-browser')).toContainText('Chrome');

    // Take screenshot of synced state
    await popup.screenshot({ path: 'test-results/history-sync-after.png' });

    // Test device name change
    const deviceNameInput = popup.locator('input[type="text"]');
    await deviceNameInput.fill('Test Device');
    await deviceNameInput.press('Enter');

    // Verify device name is saved
    await popup.reload();
    await expect(deviceNameInput).toHaveValue('Test Device');

    // Take screenshot of device name change
    await popup.screenshot({ path: 'test-results/history-sync-device.png' });
  });

  test('should handle multiple history items', async ({ context }) => {
    const extensionId = await loadExtension(context);
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

    // Open multiple pages
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);

    await Promise.all([
      pages[0].goto('https://example.com'),
      pages[1].goto('https://github.com'),
      pages[2].goto('https://playwright.dev')
    ]);

    // Check history in popup
    const popup = await context.newPage();
    await popup.goto(extensionUrl);
    await popup.waitForSelector('.history-list');

    const historyItems = popup.locator('.history-item');
    await expect(historyItems).toHaveCount(3);

    // Take screenshot of multiple history items
    await popup.screenshot({ path: 'test-results/history-sync-multiple.png' });
  });
});