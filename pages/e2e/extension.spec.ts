import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Chrome Extension', () => {
  // Set up test environment with real extension
  test.beforeEach(async ({ context }) => {
    // Log requests for debugging
    await context.route('**/*', route => {
      console.log(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });
  });

  test('extension should sync history with staging', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Create a page with extension loaded
    const page = await context.newPage();
    await page.goto(process.env.BASE_URL || 'https://staging.chroniclesync.xyz');

    // Wait for extension to initialize
    await page.waitForSelector('.health-check');

    // Get extension background page
    const backgroundPages = await context.backgroundPages();
    const backgroundPage = backgroundPages[0];
    expect(backgroundPage).toBeTruthy();

    // Verify extension is working
    const extensionId = await backgroundPage.evaluate(() => chrome.runtime.id);
    expect(extensionId).toBeTruthy();

    // Visit a test page and verify history sync
    await page.goto(`${process.env.BASE_URL}/test`);
    await page.waitForLoadState('networkidle');

    // Check history in extension
    const history = await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.history.search({
          text: '',
          startTime: 0,
          maxResults: 10
        }, (results) => resolve(results));
      });
    });

    expect(history).toBeTruthy();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    // Verify history contains our test page
    const testPageHistory = history.find(h => h.url.includes(process.env.BASE_URL || 'staging.chroniclesync.xyz'));
    expect(testPageHistory).toBeTruthy();
  });

  test('extension should handle API errors gracefully', async ({ context }) => {
    // Create a page with extension loaded
    const page = await context.newPage();
    await page.goto(process.env.BASE_URL || 'https://staging.chroniclesync.xyz');

    // Get extension background page
    const backgroundPages = await context.backgroundPages();
    const backgroundPage = backgroundPages[0];
    expect(backgroundPage).toBeTruthy();

    // Mock API error
    await context.route('**/api*.chroniclesync.xyz/**', route =>
      route.fulfill({ status: 500, body: 'Server error' })
    );

    // Visit a page to trigger sync
    await page.goto(`${process.env.BASE_URL}/test`);
    await page.waitForLoadState('networkidle');

    // Extension should still be functional
    const extensionId = await backgroundPage.evaluate(() => chrome.runtime.id);
    expect(extensionId).toBeTruthy();
  });

  test('extension should sync with IndexedDB', async ({ context }) => {
    // Create a page with extension loaded
    const page = await context.newPage();
    await page.goto(process.env.BASE_URL || 'https://staging.chroniclesync.xyz');

    // Wait for extension to initialize
    await page.waitForSelector('.health-check');

    // Test IndexedDB operations
    const dbResult = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('chroniclesync', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    });

    expect(dbResult).toBe(true);
  });
});
});