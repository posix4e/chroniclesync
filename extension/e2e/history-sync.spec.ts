import { test, expect, Page } from '@playwright/test';

const getExtensionUrl = (path: string) => 
  `chrome-extension://${process.env.EXTENSION_ID}${path}`;

test.describe('History Sync Feature', () => {
  let page: Page;

  test.beforeEach(async ({ context }) => {
    // Create a new page with extension loaded
    page = await context.newPage();
    await page.goto(getExtensionUrl('/settings.html'));
  });

  test('should configure client ID and verify settings', async () => {
    // Fill in client ID
    await page.fill('#clientId', 'test-client-id');
    await page.selectOption('#environment', 'staging');
    
    // Save settings
    await page.click('#saveSettings');
    
    // Verify settings are saved
    const message = await page.waitForSelector('.message.success');
    expect(await message.textContent()).toBe('Settings saved successfully!');
    
    // Reload page and verify persistence
    await page.reload();
    expect(await page.inputValue('#clientId')).toBe('test-client-id');
    expect(await page.inputValue('#environment')).toBe('staging');
  });

  test('should sync history after visiting pages', async () => {
    // Configure client ID first
    await page.fill('#clientId', 'test-client-id');
    await page.click('#saveSettings');

    // Visit some test pages
    const testPages = [
      'https://example.com',
      'https://test.com',
      'https://demo.com'
    ];

    for (const url of testPages) {
      await page.goto(url);
      // Wait for history sync to process
      await page.waitForTimeout(1000);
    }

    // Open extension popup to check sync status
    await page.goto(getExtensionUrl('/popup.html'));
    const syncStatus = await page.waitForSelector('[data-testid="sync-status"]');
    expect(await syncStatus.textContent()).toContain('Synced');
  });

  test('should handle offline scenarios', async ({ context }) => {
    // Configure client ID
    await page.fill('#clientId', 'test-client-id');
    await page.click('#saveSettings');

    // Simulate offline
    await context.setOffline(true);

    // Visit a page
    await page.goto('https://example.com');
    
    // Check error handling in popup
    await page.goto(getExtensionUrl('/popup.html'));
    const errorStatus = await page.waitForSelector('[data-testid="sync-error"]');
    expect(await errorStatus.textContent()).toContain('Offline');

    // Restore online and verify sync recovery
    await context.setOffline(false);
    await page.waitForTimeout(5000); // Wait for retry
    
    const syncStatus = await page.waitForSelector('[data-testid="sync-status"]');
    expect(await syncStatus.textContent()).toContain('Synced');
  });

  test('should respect environment settings', async () => {
    // Test production environment
    await page.fill('#clientId', 'test-client-id');
    await page.selectOption('#environment', 'production');
    await page.click('#saveSettings');
    
    // Visit a page and verify API endpoint
    await page.goto('https://example.com');
    // TODO: Add network request verification for production API

    // Test staging environment
    await page.goto(getExtensionUrl('/settings.html'));
    await page.selectOption('#environment', 'staging');
    await page.click('#saveSettings');
    
    // Visit another page and verify staging API endpoint
    await page.goto('https://test.com');
    // TODO: Add network request verification for staging API
  });

  test('should handle custom API URL', async () => {
    // Configure custom environment
    await page.fill('#clientId', 'test-client-id');
    await page.selectOption('#environment', 'custom');
    await page.fill('#customApiUrl', 'https://custom-api.example.com');
    await page.click('#saveSettings');

    // Visit a page and verify custom API endpoint
    await page.goto('https://example.com');
    // TODO: Add network request verification for custom API
  });
});

test.describe('History Sync UI Elements', () => {
  test('should show sync status in popup', async ({ page }) => {
    await page.goto(getExtensionUrl('/popup.html'));
    
    // Verify UI elements
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync"]')).toBeVisible();
  });

  test('should update UI during sync', async ({ page }) => {
    await page.goto(getExtensionUrl('/popup.html'));
    
    // Click force sync
    await page.click('[data-testid="force-sync"]');
    
    // Verify loading state
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Syncing');
    
    // Wait for sync to complete
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');
  });
});