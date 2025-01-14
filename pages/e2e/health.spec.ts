import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
  });

  test('should display overall system health status', async ({ page }) => {
    const healthStatus = page.locator('.health-status');
    await expect(healthStatus).toBeVisible();
    
    // Check for main health indicator
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toHaveClass(/status-healthy/);
  });

  test('should show detailed component statuses', async ({ page }) => {
    // Check database connection status
    const dbStatus = page.locator('.component-status[data-component="database"]');
    await expect(dbStatus).toBeVisible();
    await expect(dbStatus).toContainText('Database Connection');
    
    // Check API endpoint status
    const apiStatus = page.locator('.component-status[data-component="api"]');
    await expect(apiStatus).toBeVisible();
    await expect(apiStatus).toContainText('API Endpoints');
    
    // Check worker status
    const workerStatus = page.locator('.component-status[data-component="worker"]');
    await expect(workerStatus).toBeVisible();
    await expect(workerStatus).toContainText('Background Worker');
  });

  test('should display system metrics', async ({ page }) => {
    const metricsSection = page.locator('.system-metrics');
    await expect(metricsSection).toBeVisible();
    
    // Check for specific metrics
    await expect(page.getByText('Response Time')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();
    await expect(page.getByText('Active Connections')).toBeVisible();
  });

  test('should handle refresh of health status', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh Status' });
    await expect(refreshButton).toBeVisible();
    
    // Click refresh and verify loading state
    await refreshButton.click();
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // Verify refresh completed
    await expect(page.locator('.loading-indicator')).not.toBeVisible();
    await expect(page.locator('.last-updated')).toContainText('Last updated:');
  });
});