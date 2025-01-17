import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { ExtensionPage } from './pages/extension.page';

test.describe('ChronicleSync Web App with Extension', () => {
  let homePage: HomePage;
  let extensionPage: ExtensionPage;

  test.beforeEach(async ({ context, page }) => {
    // Log requests for debugging
    await context.route('**/*', route => {
      console.log(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    homePage = new HomePage(page);
    extensionPage = new ExtensionPage(page, context);
    await homePage.navigate();
  });

  test('should load web app with extension and verify functionality', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Verify web app loads correctly
    const title = await homePage.verifyTitle();
    expect(title).toBe('ChronicleSync - IndexedDB Synchronization Service');

    // Verify health check component
    await expect(page.getByText('System Health')).toBeVisible();
    const checkButton = await page.getByRole('button', { name: 'Check Health' });
    await checkButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.health-status')).toContainText('Healthy');

    // Verify extension functionality
    await extensionPage.verifyExtensionId();
    await extensionPage.verifyIndexedDB();

    // Visit a test page to trigger history sync
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    await page.goto(`${testUrl}/test`);
    await page.waitForLoadState('networkidle');

    // Verify history sync
    await extensionPage.verifyHistorySync(testUrl);

    // Take screenshots for visual verification
    await page.screenshot({ path: 'test-results/app-with-extension.png', fullPage: true });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await extensionPage.mockAPIError();

    // Verify web app still loads
    await expect(page.getByText('System Health')).toBeVisible();

    // Extension should still be functional
    await extensionPage.verifyExtensionId();

    // Visit a page to trigger sync (should handle error gracefully)
    await page.goto(`${process.env.BASE_URL}/test`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/error-handling.png', fullPage: true });
  });
});