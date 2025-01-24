import { test, expect } from '@playwright/test';
import { loadExtension } from './utils/extension';

test.describe('History Sync', () => {
  test('syncs history across tabs and shows device info', async ({ context }) => {
    // Load extension in first window
    const extensionId = await loadExtension(context);
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(extensionUrl);

    // Take screenshot of initial state
    await popup.screenshot({ path: 'test-results/history-sync-initial.png' });

    // Set device name
    const deviceNameInput = popup.locator('input[type="text"]');
    await deviceNameInput.fill('Test Device');
    await deviceNameInput.press('Enter');

    // Navigate to test pages in new tabs
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

    // Wait for pages to load
    await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));

    // Refresh popup and wait for history to sync
    await popup.reload();
    await popup.waitForSelector('.history-list');

    // Take screenshot of synced state
    await popup.screenshot({ path: 'test-results/history-sync-after.png' });

    // Verify history items are present
    const historyItems = popup.locator('.history-item');
    await expect(historyItems).toHaveCount(3);

    // Check URLs are listed
    await expect(popup.getByRole('link', { name: /example\.com/i })).toBeVisible();
    await expect(popup.getByRole('link', { name: /github\.com/i })).toBeVisible();
    await expect(popup.getByRole('link', { name: /playwright\.dev/i })).toBeVisible();

    // Verify device info is shown
    const deviceInfo = popup.locator('.device-info').first();
    await expect(deviceInfo.locator('.device-name')).toHaveText('Test Device');
    await expect(deviceInfo.locator('.device-browser')).toBeVisible();
    await expect(deviceInfo.locator('.device-os')).toBeVisible();
  });

  test('filters and sorts history items', async ({ context }) => {
    const extensionId = await loadExtension(context);
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(extensionUrl);

    // Set device name
    await popup.locator('input[type="text"]').fill('Filter Test Device');

    // Create some history
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.goto('https://github.com');
    await page.goto('https://playwright.dev');

    // Refresh popup and wait for history
    await popup.reload();
    await popup.waitForSelector('.history-list');

    // Take screenshot of initial list
    await popup.screenshot({ path: 'test-results/history-filter-before.png' });

    // Test sorting by date (default)
    const historyItems = popup.locator('.history-item');
    await expect(historyItems.first().locator('a')).toHaveAttribute('href', 'https://playwright.dev');

    // Sort by device name
    await popup.selectOption('select', { label: 'Sort by Device' });
    await popup.screenshot({ path: 'test-results/history-sort-device.png' });

    // Filter by current device
    const deviceId = await popup.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get('clientId', data => resolve(data.clientId));
      });
    });
    await popup.selectOption('.history-controls select:last-child', deviceId as string);
    await popup.screenshot({ path: 'test-results/history-filter-device.png' });

    // Verify filtered items are from current device
    const filteredItems = popup.locator('.history-item');
    await expect(filteredItems).toHaveCount(3);
    for (const item of await filteredItems.all()) {
      await expect(item.locator('.device-name')).toHaveText('Filter Test Device');
    }
  });

  test('handles device status updates', async ({ context }) => {
    const extensionId = await loadExtension(context);
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

    // Open extension in two contexts to simulate different devices
    const popupA = await context.newPage();
    await popupA.goto(extensionUrl);
    await popupA.locator('input[type="text"]').fill('Device A');

    const contextB = await context.browser().newContext();
    const popupB = await contextB.newPage();
    await popupB.goto(extensionUrl);
    await popupB.locator('input[type="text"]').fill('Device B');

    // Wait for devices to appear in list
    await popupA.waitForSelector('.device-list');
    await popupB.waitForSelector('.device-list');

    // Take screenshots of device lists
    await popupA.screenshot({ path: 'test-results/devices-list-a.png' });
    await popupB.screenshot({ path: 'test-results/devices-list-b.png' });

    // Verify both devices are listed
    await expect(popupA.locator('.device-item')).toHaveCount(2);
    await expect(popupB.locator('.device-item')).toHaveCount(2);

    // Verify device names are correct
    await expect(popupA.getByText('Device A')).toBeVisible();
    await expect(popupA.getByText('Device B')).toBeVisible();
    await expect(popupB.getByText('Device A')).toBeVisible();
    await expect(popupB.getByText('Device B')).toBeVisible();

    // Close context B and wait for device list update
    await contextB.close();
    await popupA.waitForTimeout(5000); // Wait for device status update interval

    // Refresh popup A
    await popupA.reload();
    await popupA.waitForSelector('.device-list');

    // Take screenshot of updated device list
    await popupA.screenshot({ path: 'test-results/devices-list-after.png' });

    // Verify only active device remains
    await expect(popupA.locator('.device-item')).toHaveCount(1);
    await expect(popupA.getByText('Device A')).toBeVisible();
  });
});