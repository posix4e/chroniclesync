import { test, expect } from '@playwright/test';

test.describe('History Sync', () => {
  test('should sync history between extension and server', async ({ page }) => {
    // Navigate to the extension page
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/initial-state.png' });

    // Simulate adding history items
    const mockHistoryItems = [
      { url: 'https://example.com', title: 'Example Domain', visitTime: Date.now() },
      { url: 'https://github.com', title: 'GitHub', visitTime: Date.now() - 1000 }
    ];

    // Add items to local storage to simulate extension
    await page.evaluate((items) => {
      localStorage.setItem('chroniclesync_history', JSON.stringify(items));
    }, mockHistoryItems);

    // Trigger sync
    await page.click('button:has-text("Sync Now")');
    await page.screenshot({ path: 'screenshots/after-sync.png' });

    // Verify items are displayed in the UI
    await expect(page.getByText('Example Domain')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();

    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.screenshot({ path: 'screenshots/cleared-storage.png' });

    // Trigger sync again to verify items are pulled from server
    await page.click('button:has-text("Sync Now")');
    await page.screenshot({ path: 'screenshots/after-second-sync.png' });

    // Verify items are still displayed
    await expect(page.getByText('Example Domain')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();
  });

  test('should handle offline mode', async ({ page }) => {
    // Set the page to offline mode
    await page.context().setOffline(true);
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/offline-mode.png' });

    // Add history items while offline
    const offlineHistoryItem = {
      url: 'https://offline-example.com',
      title: 'Offline Example',
      visitTime: Date.now()
    };

    await page.evaluate((item) => {
      localStorage.setItem('chroniclesync_history', JSON.stringify([item]));
    }, offlineHistoryItem);

    // Verify offline item is visible
    await expect(page.getByText('Offline Example')).toBeVisible();
    await page.screenshot({ path: 'screenshots/offline-item-added.png' });

    // Set the page back online
    await page.context().setOffline(false);

    // Trigger sync and verify the item is synced
    await page.click('button:has-text("Sync Now")');
    await page.screenshot({ path: 'screenshots/after-offline-sync.png' });

    // Verify the offline item is still visible and synced
    await expect(page.getByText('Offline Example')).toBeVisible();
  });
});