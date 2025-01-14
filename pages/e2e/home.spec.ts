import { test, expect } from '@playwright/test';

test.describe('Web App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
  });

  test('should load the landing page', async ({ page }) => {
    // Log the URL we're testing
    console.log('Testing URL:', page.url());
    
    await page.goto('/', { timeout: 30000 }); // Increase timeout and log result
    console.log('Page loaded:', page.url());
    
    // Take a screenshot before any interactions
    await page.screenshot({ 
      path: './test-results/landing-page.png',
      fullPage: true 
    });
    console.log('Screenshot taken');

    // Log the page content for debugging
    console.log('Page content:', await page.content());

    // Verify page title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBe('ChronicleSync - IndexedDB Synchronization Service');

    // Verify main content is visible
    const main = await page.locator('body').first();
    await expect(main).toBeVisible();
    console.log('Body content:', await main.textContent());
  });

  test('should interact with health check component', async ({ page }) => {
    // Verify initial health check state
    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check Health' })).toBeVisible();
    await expect(page.getByText('Status:')).toBeVisible();
    await expect(page.getByText('Checking...')).toBeVisible();
    await expect(page.getByText('Last Check:')).toBeVisible();
    await expect(page.getByText('Never')).toBeVisible();

    // Click the health check button
    await page.getByRole('button', { name: 'Check Health' }).click();

    // Wait for and verify the health status update
    // Note: The actual status might vary depending on the system state
    await expect(page.getByText('Status:')).toBeVisible();
    
    // Take a screenshot after health check
    await page.screenshot({ 
      path: './test-results/health-check.png',
      fullPage: true 
    });

    // Verify the last check time is updated (should no longer show "Never")
    await expect(page.getByText('Never')).not.toBeVisible();
  });
});