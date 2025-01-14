import { test, expect } from '@playwright/test';

test.describe('Client Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display client connection status', async ({ page }) => {
    const statusSection = page.locator('.client-status');
    await expect(statusSection).toBeVisible();
    
    // Check connection indicator
    const connectionStatus = page.locator('.connection-indicator');
    await expect(connectionStatus).toBeVisible();
  });

  test('should show sync progress when active', async ({ page }) => {
    // Trigger a sync operation (this would depend on your app's specific implementation)
    await page.getByRole('button', { name: 'Sync Now' }).click();
    
    // Verify sync progress elements
    const progressBar = page.locator('.sync-progress');
    await expect(progressBar).toBeVisible();
    
    // Wait for sync to complete
    await expect(page.getByText('Sync Complete')).toBeVisible({ timeout: 10000 });
  });

  test('should display sync history', async ({ page }) => {
    const historySection = page.locator('.sync-history');
    await expect(historySection).toBeVisible();
    
    // Check for history entries
    const historyEntries = page.locator('.history-entry');
    await expect(historyEntries).toHaveCount(1);
    
    // Verify history entry details
    const firstEntry = historyEntries.first();
    await expect(firstEntry.getByText('Last Sync:')).toBeVisible();
    await expect(firstEntry.getByText('Status:')).toBeVisible();
  });

  test('should handle offline mode gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Check offline indicator
    await expect(page.getByText('Offline Mode')).toBeVisible();
    
    // Verify sync button is disabled
    const syncButton = page.getByRole('button', { name: 'Sync Now' });
    await expect(syncButton).toBeDisabled();
    
    // Return to online mode
    await page.context().setOffline(false);
    await expect(syncButton).toBeEnabled();
  });
});