const { test, expect } = require('@playwright/test');

test.describe('ChronicleSync App', () => {
  test('initializes client and syncs data', async ({ page }) => {
    await page.goto('/');
    
    // Initialize client
    const clientId = `test-${Date.now()}`;
    await page.fill('#clientId', clientId);
    await page.click('button:text("Initialize")');
    
    // Data section should be visible
    await expect(page.locator('#dataSection')).toBeVisible();
    
    // Enter and save data
    const testData = JSON.stringify({ test: 'data' }, null, 2);
    await page.fill('#dataInput', testData);
    await page.click('button:text("Save Data")');
    
    // Sync data
    await page.click('button:text("Sync with Server")');
    
    // Check for success message (you'll need to add this to the UI)
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('admin interface shows client data', async ({ page }) => {
    await page.goto('/');
    
    // Login as admin
    await page.fill('#adminPassword', 'francesisthebest');
    await page.click('button:text("Login")');
    
    // Admin panel should be visible
    await expect(page.locator('#adminPanel')).toBeVisible();
    
    // Stats table should be present
    await expect(page.locator('#statsTable')).toBeVisible();
    
    // Refresh stats
    await page.click('button:text("Refresh Stats")');
    
    // Check if table has data
    const rows = await page.locator('#statsTable tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });
});