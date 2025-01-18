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

  test('should load web app with extension and verify basic functionality @basic', async ({ page }) => {
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

    // Take screenshots for visual verification
    await page.screenshot({ path: 'test-results/app-with-extension.png', fullPage: true });
  });

  test('should sync history with multiple URLs and timestamps @history', async ({ page }) => {
    // Visit multiple pages with different timestamps
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    const urls = [
      `${testUrl}/test1`,
      `${testUrl}/test2`,
      `${testUrl}/test3`
    ];

    // Visit pages with delays to ensure different timestamps
    for (const url of urls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Ensure different timestamps
    }

    // Verify all URLs are synced
    const history = await extensionPage.verifyHistorySync(testUrl);
    for (const url of urls) {
      const entry = history.find(h => h.url?.includes(url));
      expect(entry).toBeTruthy();
      expect(entry?.visitCount).toBeGreaterThan(0);
    }

    // Verify timestamps are different
    const timestamps = history
      .filter(h => h.url?.includes(testUrl))
      .map(h => h.lastVisitTime);
    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(urls.length);
  });

  test('should handle history sync conflicts and deletions @history', async ({ page, context }) => {
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    
    // Create conflicting history entries
    await page.goto(`${testUrl}/conflict-test`);
    await page.waitForLoadState('networkidle');

    // Simulate another browser modifying the same URL
    const newContext = await context.browser()?.newContext();
    const newPage = await newContext?.newPage();
    if (newPage) {
      await newPage.goto(`${testUrl}/conflict-test`);
      await newPage.waitForLoadState('networkidle');
      await newPage.close();
    }
    await newContext?.close();

    // Verify conflict resolution
    const history = await extensionPage.verifyHistorySync(testUrl);
    const conflictEntry = history.find(h => h.url?.includes('conflict-test'));
    expect(conflictEntry?.visitCount).toBeGreaterThan(1);

    // Test history deletion
    await extensionPage.deleteHistoryItem(`${testUrl}/conflict-test`);
    const updatedHistory = await extensionPage.verifyHistorySync(testUrl);
    expect(updatedHistory.find(h => h.url?.includes('conflict-test'))).toBeFalsy();
  });

  test('should handle network issues and timeouts @network', async ({ page }) => {
    // Test timeout handling
    await extensionPage.mockNetworkDelay(5000);
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    await page.goto(`${testUrl}/timeout-test`);
    
    // Should handle timeout gracefully
    await expect(page.getByText('System Health')).toBeVisible();
    await extensionPage.verifyExtensionId();

    // Test offline mode
    await extensionPage.mockOffline();
    await page.goto(`${testUrl}/offline-test`);
    await page.waitForLoadState('networkidle');

    // Should work offline and sync when back online
    await extensionPage.mockOnline();
    await page.waitForTimeout(1000);
    const history = await extensionPage.verifyHistorySync(testUrl);
    expect(history.find(h => h.url?.includes('offline-test'))).toBeTruthy();
  });

  test('should handle large history sync operations @history', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for large sync

    // Create many history entries
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    const urls = Array.from({ length: 100 }, (_, i) => `${testUrl}/bulk-test-${i}`);

    // Visit many pages quickly
    for (const url of urls) {
      await page.goto(url);
      // Don't wait for network idle to speed up the test
      await page.waitForLoadState('domcontentloaded');
    }

    // Verify all entries are synced
    const history = await extensionPage.verifyHistorySync(testUrl);
    const syncedUrls = history.filter(h => h.url?.includes('bulk-test')).length;
    expect(syncedUrls).toBeGreaterThanOrEqual(urls.length);
  });

  test('should enforce security policies @security', async ({ page }) => {
    // Test CSP violations
    await extensionPage.injectScript('alert("test")');
    const violations = await extensionPage.getCspViolations();
    expect(violations.length).toBeGreaterThan(0);

    // Test HTTPS certificate validation
    await extensionPage.mockInvalidCertificate();
    const testUrl = process.env.BASE_URL || 'staging.chroniclesync.xyz';
    const certError = await extensionPage.navigateWithError(`${testUrl}/cert-test`);
    expect(certError).toContain('certificate');

    // Test cross-origin requests
    await extensionPage.mockCrossOriginRequest();
    const corsError = await extensionPage.getCorsViolations();
    expect(corsError.length).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully @network', async ({ page }) => {
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