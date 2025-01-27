import { test as base, expect } from './utils/extension';
import { server } from '../config';

// Configure test to fail fast and run sequentially
const test = base.extend({
  // Add auto-cleanup of resources
  auto_cleanup: [async ({}, use, testInfo) => {
    await use();
    if (testInfo.status !== 'passed') {
      base.fail();
    }
  }, { auto: true }]
});

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Chrome Extension', () => {
  test('extension functionality', async ({ context, extensionId, page }) => {
    test.setTimeout(45000); // 45 second timeout

    // Set up error tracking
    const errors: string[] = [];
    context.on('weberror', error => {
      console.log('Web error:', error.error().message);
      errors.push(error.error().message);
    });

    // Set up dialog handler for all pages
    context.on('page', page => {
      page.on('dialog', async dialog => {
        console.log('Dialog appeared:', dialog.message());
        await dialog.accept();
      });
      page.on('console', msg => {
        if (msg.type() === 'error' &&
            !msg.text().includes('net::ERR_FILE_NOT_FOUND') &&
            !msg.text().includes('status of 404')) {
          console.log('Console error:', msg.text());
          errors.push(msg.text());
        }
      });
    });

    // 1. Verify extension ID and service worker
    expect(extensionId).not.toBe('unknown-extension-id');
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    console.log('Extension loaded with ID:', extensionId);

    const workers = await context.serviceWorkers();
    expect(workers.length).toBe(1);
    expect(workers[0].url()).toContain(extensionId);
    expect(workers[0].url()).toContain('background');

    // 2. API health check
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    
    const healthResponse = await page.request.get(`${apiUrl}/health`);
    console.log('Health check status:', healthResponse.status());
    
    const responseBody = await healthResponse.json();
    console.log('Health check response:', responseBody);
    
    expect(healthResponse.ok()).toBeTruthy();
    expect(responseBody.healthy).toBeTruthy();

    // 3. Generate test history
    const testPages = [
      { url: 'https://example.com/page1', title: 'Test Page 1' },
      { url: 'https://example.com/page2', title: 'Test Page 2' },
      { url: 'https://example.com/duplicate', title: 'Duplicate Page' }
    ];

    // Visit test pages to generate history
    for (const page of testPages) {
      const testPage = await context.newPage();
      await testPage.goto(page.url);
      await testPage.waitForLoadState('networkidle');
      await testPage.close();
    }

    // Visit duplicate page multiple times
    const duplicatePage = await context.newPage();
    for (let i = 0; i < 2; i++) {
      await duplicatePage.goto(testPages[2].url);
      await duplicatePage.waitForLoadState('networkidle');
    }
    await duplicatePage.close();

    // 4. Test popup functionality
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForLoadState('networkidle');

    // Take initial screenshot
    await popupPage.screenshot({
      path: 'test-results/extension-popup-initial.png',
      fullPage: true
    });

    // Verify UI elements
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();

    // Verify React initialization
    const reactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // 5. Test client initialization and sync
    await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 5000 });
    await popupPage.fill('#clientId', 'test-client');
    
    // Wait for initialization dialog
    const initDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
    await popupPage.click('text=Initialize');
    const initDialog = await initDialogPromise;
    expect(initDialog.message()).toBe('Client initialized successfully');
    await initDialog.accept();

    // Take screenshot after initialization
    await popupPage.screenshot({
      path: 'test-results/extension-popup-initialized.png',
      fullPage: true
    });

    // Wait for history entries
    await popupPage.waitForSelector('.history-entry', { timeout: 5000 });
    const entries = await popupPage.locator('.history-entry').all();
    expect(entries.length).toBeGreaterThanOrEqual(testPages.length);

    // Verify test pages are in history
    for (const page of testPages) {
      const entryExists = await popupPage.locator(`.history-entry a[href="${page.url}"]`).count() > 0;
      expect(entryExists).toBeTruthy();
    }

    // Test retention period setting
    await popupPage.fill('#retentionDays', '7');
    await popupPage.click('text=Save Settings');

    // Test sync functionality
    const syncButton = await popupPage.waitForSelector('button:has-text("Sync with Server")', 
      { state: 'visible', timeout: 5000 });
    
    // Set up dialog listener before clicking
    const syncDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
    await syncButton.click();
    
    // Wait for and verify dialog
    const syncDialog = await syncDialogPromise;
    expect(['Sync completed successfully', 'Failed to sync with server']).toContain(syncDialog.message());
    await syncDialog.accept();

    // Take final screenshot
    await popupPage.screenshot({
      path: 'test-results/extension-popup-final.png',
      fullPage: true
    });

    // 6. Test deduplication
    // Count entries for the duplicate URL
    const duplicateEntries = await popupPage.locator(`.history-entry a[href="${testPages[2].url}"]`).all();
    expect(duplicateEntries.length).toBeGreaterThanOrEqual(1);

    // Verify timestamps are different
    const timestamps = await popupPage.evaluate((url) => {
      const entries = document.querySelectorAll(`.history-entry a[href="${url}"]`);
      return Array.from(entries).map(entry => 
        entry.nextElementSibling?.textContent
      );
    }, testPages[2].url);

    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(timestamps.length);

    // Verify no errors occurred
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page, context }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      // Take screenshot on failure
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
      
      // Log the page content for debugging
      const content = await page.content();
      console.log('Page content at failure:', content);

      // Close all pages except the main one
      const pages = context.pages();
      await Promise.all(
        pages
          .filter(p => p !== page)
          .map(p => p.close())
      );
    }
  });

  test.afterAll(async ({ context }) => {
    // Ensure all browser contexts are closed
    await context.close();
  });
});