import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test.describe('Web App', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate();
  });

  test('should load the landing page', async () => {
    await homePage.takePageScreenshot('landing-page');
    
    const title = await homePage.verifyTitle();
    expect(title).toBe('ChronicleSync - IndexedDB Synchronization Service');
  });

  test('should interact with health check component', async ({ page }) => {
    // Verify initial health check state
    await expect(page.getByText('System Health')).toBeVisible();
    
    // Click the health check button and wait for response
    const checkButton = await page.getByRole('button', { name: 'Check Health' });
    await checkButton.click();

    // Wait for network idle to ensure request completes
    await page.waitForLoadState('networkidle');

    // Verify health check response
    await expect(page.locator('text=Last Check:')).toBeVisible();
    await expect(page.locator('.health-status')).toContainText('Healthy');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'health-check.png', fullPage: true });
  });
});