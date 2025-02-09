import { test, expect, Page } from '@playwright/test';

const getExtensionUrl = (path: string) => 
  `chrome-extension://${process.env.EXTENSION_ID}${path}`;

const SCREENSHOTS_DIR = 'test-results/screenshots';

// Helper function to take a screenshot with a descriptive name
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `${SCREENSHOTS_DIR}/${name}.png`,
    fullPage: true 
  });
}

test.describe('History Sync Feature', () => {
  let page: Page;

  test.beforeEach(async ({ context }) => {
    // Create a new page and get extension ID
    page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);

    // Get extension ID from service workers
    const workers = await context.serviceWorkers();
    const extensionWorker = workers.find(w => w.url().includes('background.js'));
    const extensionId = extensionWorker.url().split('/')[2];
    process.env.EXTENSION_ID = extensionId;

    // Navigate to extension page
    await page.goto(getExtensionUrl('/settings.html'));
  });

  test('should configure client ID and verify settings', async () => {
    // Fill in client ID
    await page.fill('#clientId', 'test-client-id');
    await page.selectOption('#environment', 'staging');
    await takeScreenshot(page, 'settings-before-save');
    
    // Save settings
    await page.click('#saveSettings');
    
    // Verify settings are saved
    const message = await page.waitForSelector('.message.success');
    expect(await message.textContent()).toBe('Settings saved successfully!');
    await takeScreenshot(page, 'settings-saved-success');
    
    // Reload page and verify persistence
    await page.reload();
    await page.waitForSelector('#clientId');
    expect(await page.inputValue('#clientId')).toBe('test-client-id');
    expect(await page.inputValue('#environment')).toBe('staging');
    await takeScreenshot(page, 'settings-persistence-verified');
  });

  test('should sync history after visiting pages', async () => {
    // Configure client ID first
    await page.fill('#clientId', 'test-client-id');
    await page.click('#saveSettings');
    await takeScreenshot(page, 'history-sync-initial-config');

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
      await takeScreenshot(page, `history-sync-visit-${url.replace(/[^a-z0-9]/gi, '-')}`);
    }

    // Open extension popup to check sync status
    await page.goto(getExtensionUrl('/popup.html'));
    const syncStatus = await page.waitForSelector('[data-testid="sync-status"]');
    expect(await syncStatus.textContent()).toContain('Synced');
    await takeScreenshot(page, 'history-sync-status-synced');
  });

  test('should handle offline scenarios', async ({ context }) => {
    // Configure client ID
    await page.fill('#clientId', 'test-client-id');
    await page.click('#saveSettings');
    await takeScreenshot(page, 'offline-scenario-initial-config');

    // Simulate offline
    await context.setOffline(true);

    // Visit a page
    await page.goto('https://example.com');
    await takeScreenshot(page, 'offline-scenario-page-visit');
    
    // Check error handling in popup
    await page.goto(getExtensionUrl('/popup.html'));
    const errorStatus = await page.waitForSelector('[data-testid="sync-error"]');
    expect(await errorStatus.textContent()).toContain('Offline');
    await takeScreenshot(page, 'offline-scenario-error-state');

    // Restore online and verify sync recovery
    await context.setOffline(false);
    await page.waitForTimeout(5000); // Wait for retry
    
    const syncStatus = await page.waitForSelector('[data-testid="sync-status"]');
    expect(await syncStatus.textContent()).toContain('Synced');
    await takeScreenshot(page, 'offline-scenario-recovery');
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
    await takeScreenshot(page, 'popup-ui-elements');
  });

  test('should update UI during sync', async ({ page }) => {
    await page.goto(getExtensionUrl('/popup.html'));
    await takeScreenshot(page, 'sync-ui-before');
    
    // Click force sync
    await page.click('[data-testid="force-sync"]');
    
    // Verify loading state
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Syncing');
    await takeScreenshot(page, 'sync-ui-during');
    
    // Wait for sync to complete
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');
    await takeScreenshot(page, 'sync-ui-after');
  });
});