const { test, expect } = require('@playwright/test');

test.describe('ChronicleSync App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Client Operations', () => {
    test('initializes new client successfully', async ({ page }) => {
      const clientId = `test-${Date.now()}`;
      await page.fill('[data-testid="client-id-input"]', clientId);
      await page.click('[data-testid="initialize-button"]');
      
      await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Connected');
    });

    test('handles offline mode gracefully', async ({ page, context }) => {
      // Set up client first
      const clientId = `test-${Date.now()}`;
      await page.fill('[data-testid="client-id-input"]', clientId);
      await page.click('[data-testid="initialize-button"]');

      // Go offline
      await context.setOffline(true);
      
      // Try to sync
      await page.click('[data-testid="sync-button"]');
      
      // Should show offline status
      await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Offline');
      
      // Data should still be editable
      await page.fill('[data-testid="data-input"]', JSON.stringify({ test: 'offline' }));
      await page.click('[data-testid="save-button"]');
      
      // Should show pending changes
      await expect(page.locator('[data-testid="pending-changes"]')).toBeVisible();
    });

    test('syncs data with server', async ({ page }) => {
      // Set up client
      const clientId = `test-${Date.now()}`;
      await page.fill('[data-testid="client-id-input"]', clientId);
      await page.click('[data-testid="initialize-button"]');
      
      // Add data
      const testData = { test: 'sync-test', timestamp: Date.now() };
      await page.fill('[data-testid="data-input"]', JSON.stringify(testData, null, 2));
      await page.click('[data-testid="save-button"]');
      
      // Sync
      await page.click('[data-testid="sync-button"]');
      
      // Verify sync success
      await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Synced');
      await expect(page.locator('[data-testid="last-sync"]')).toBeVisible();
    });

    test('handles invalid JSON input', async ({ page }) => {
      // Set up client
      const clientId = `test-${Date.now()}`;
      await page.fill('[data-testid="client-id-input"]', clientId);
      await page.click('[data-testid="initialize-button"]');
      
      // Try to save invalid JSON
      await page.fill('[data-testid="data-input"]', '{ invalid: json }');
      await page.click('[data-testid="save-button"]');
      
      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid JSON');
    });
  });

  test.describe('Admin Interface', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.fill('[data-testid="admin-password"]', process.env.ADMIN_KEY);
      await page.click('[data-testid="admin-login"]');
    });

    test('shows system status', async ({ page }) => {
      await page.click('[data-testid="status-tab"]');
      
      // Check status indicators
      await expect(page.locator('[data-testid="database-status"]')).toHaveText('Connected');
      await expect(page.locator('[data-testid="storage-status"]')).toHaveText('Connected');
      await expect(page.locator('[data-testid="worker-status"]')).toHaveText('Connected');
    });

    test('lists active clients', async ({ page }) => {
      await page.click('[data-testid="clients-tab"]');
      
      // Should show clients table
      await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();
      
      // Refresh client list
      await page.click('[data-testid="refresh-clients"]');
      
      // Should have at least one row (from previous tests)
      const rows = await page.locator('[data-testid="client-row"]').count();
      expect(rows).toBeGreaterThan(0);
    });

    test('can view client details', async ({ page }) => {
      await page.click('[data-testid="clients-tab"]');
      
      // Click on first client
      await page.click('[data-testid="client-row"]');
      
      // Should show client details
      await expect(page.locator('[data-testid="client-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-data"]')).toBeVisible();
    });
  });
});