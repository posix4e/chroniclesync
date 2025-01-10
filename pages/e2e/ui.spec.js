const { test, expect } = require('@playwright/test');

test.describe('ChronicleSync UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('client initialization and data sync', async ({ page }) => {
    // Initialize client
    const clientId = `test-${Date.now()}`;
    await page.fill('#clientId', clientId);
    await page.click('button:text("Initialize")');
    await expect(page.locator('#dataSection')).toBeVisible();

    // Enter and sync data
    const testData = {
      notes: 'Test note',
      timestamp: new Date().toISOString()
    };
    await page.fill('#dataInput', JSON.stringify(testData, null, 2));
    await page.click('button:text("Save Data")');

    // Verify local storage
    const localData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('chronicleData'));
    });
    expect(localData).toEqual(testData);

    // Sync with server
    await page.click('button:text("Sync with Server")');
    await expect(page.locator('.success-message')).toBeVisible();

    // Verify sync status
    const syncStatus = await page.locator('#syncStatus').textContent();
    expect(syncStatus).toContain('Last synced:');
  });

  test('data persistence and reload', async ({ page }) => {
    // Initialize client
    const clientId = `test-${Date.now()}`;
    await page.fill('#clientId', clientId);
    await page.click('button:text("Initialize")');

    // Add test data
    const testData = { test: 'persistence' };
    await page.fill('#dataInput', JSON.stringify(testData, null, 2));
    await page.click('button:text("Save Data")');
    await page.click('button:text("Sync with Server")');

    // Reload page
    await page.reload();

    // Re-initialize with same client ID
    await page.fill('#clientId', clientId);
    await page.click('button:text("Initialize")');

    // Verify data is loaded
    const loadedData = await page.inputValue('#dataInput');
    expect(JSON.parse(loadedData)).toEqual(testData);
  });

  test('admin interface functionality', async ({ page }) => {
    // Login as admin
    await page.fill('#adminPassword', 'francesisthebest');
    await page.click('button:text("Login")');
    await expect(page.locator('#adminPanel')).toBeVisible();

    // Check stats table
    await expect(page.locator('#statsTable')).toBeVisible();
    await page.click('button:text("Refresh Stats")');

    // Verify table structure
    await expect(page.locator('#statsTable th')).toHaveCount(4);
    await expect(page.locator('#statsTable')).toContainText('Client ID');
    await expect(page.locator('#statsTable')).toContainText('Last Sync');

    // Test search functionality
    await page.fill('#clientSearch', 'test');
    await expect(page.locator('#statsTable tbody tr')).toHaveCount(1);
  });

  test('error handling', async ({ page }) => {
    // Test invalid client ID
    await page.fill('#clientId', '');
    await page.click('button:text("Initialize")');
    await expect(page.locator('.error-message')).toBeVisible();

    // Test invalid data format
    await page.fill('#clientId', 'test-client');
    await page.click('button:text("Initialize")');
    await page.fill('#dataInput', 'invalid json');
    await page.click('button:text("Save Data")');
    await expect(page.locator('.error-message')).toBeVisible();

    // Test invalid admin password
    await page.fill('#adminPassword', 'wrongpassword');
    await page.click('button:text("Login")');
    await expect(page.locator('.error-message')).toBeVisible();
  });
});