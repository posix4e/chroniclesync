import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

describe('ChronicleSync Extension Acceptance Tests', () => {
  let browser;
  let context;
  let page;
  const stagingUrl = process.env.STAGING_URL || 'https://staging.chroniclesync.com';
  const extensionPath = path.resolve(__dirname, '../../../dist');

  beforeAll(async () => {
    // Load the extension from the dist directory
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should successfully authenticate with the service', async () => {
    await page.goto(stagingUrl);
    
    // Test authentication flow
    const loginButton = await page.waitForSelector('[data-testid="login-button"]');
    await loginButton.click();
    
    // Wait for auth completion and verify success
    await page.waitForSelector('[data-testid="user-profile"]');
    const profileElement = await page.$('[data-testid="user-profile"]');
    expect(profileElement).toBeTruthy();
  });

  it('should sync bookmarks successfully', async () => {
    await page.goto(stagingUrl);
    
    // Trigger sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    await syncButton.click();
    
    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-status-success"]');
    
    // Verify sync metadata was updated
    const lastSyncText = await page.$eval(
      '[data-testid="last-sync-time"]',
      el => el.textContent
    );
    expect(lastSyncText).toMatch(/Last synced: /);
  });

  it('should handle offline mode gracefully', async () => {
    await page.goto(stagingUrl);
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Attempt sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    await syncButton.click();
    
    // Verify appropriate error message
    const errorMessage = await page.waitForSelector('[data-testid="sync-error"]');
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('offline');
  });

  it('should handle large bookmark sets', async () => {
    await page.goto(stagingUrl);
    
    // Create a large set of test bookmarks
    const largeBookmarkSet = Array.from({ length: 1000 }, (_, i) => ({
      title: `Test Bookmark ${i}`,
      url: `https://example.com/${i}`
    }));
    
    // Inject bookmarks into the page
    await page.evaluate((bookmarks) => {
      window.testBookmarks = bookmarks;
    }, largeBookmarkSet);
    
    // Trigger sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    await syncButton.click();
    
    // Wait for sync completion and verify success
    await page.waitForSelector('[data-testid="sync-status-success"]');
    
    // Verify all bookmarks were synced
    const syncStats = await page.$eval(
      '[data-testid="sync-stats"]',
      el => el.textContent
    );
    expect(syncStats).toContain('1000');
  });

  it('should handle bookmark conflicts correctly', async () => {
    await page.goto(stagingUrl);
    
    // Create conflicting bookmarks
    const conflictingBookmark = {
      url: 'https://example.com/conflict',
      title: 'Conflicting Bookmark'
    };
    
    // Inject bookmark data
    await page.evaluate((bookmark) => {
      window.testBookmark = bookmark;
    }, conflictingBookmark);
    
    // Trigger sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    await syncButton.click();
    
    // Verify conflict resolution UI appears
    const conflictDialog = await page.waitForSelector('[data-testid="conflict-dialog"]');
    expect(conflictDialog).toBeTruthy();
    
    // Choose to keep local version
    const keepLocalButton = await page.waitForSelector('[data-testid="keep-local"]');
    await keepLocalButton.click();
    
    // Verify resolution was successful
    await page.waitForSelector('[data-testid="sync-status-success"]');
  });

  it('should respect user preferences', async () => {
    await page.goto(stagingUrl);
    
    // Open settings
    const settingsButton = await page.waitForSelector('[data-testid="settings-button"]');
    await settingsButton.click();
    
    // Change sync frequency to daily
    const frequencySelect = await page.waitForSelector('[data-testid="sync-frequency"]');
    await frequencySelect.selectOption('daily');
    
    // Save settings
    const saveButton = await page.waitForSelector('[data-testid="save-settings"]');
    await saveButton.click();
    
    // Verify settings were saved
    await page.reload();
    const savedFrequency = await page.$eval(
      '[data-testid="sync-frequency"]',
      el => el.value
    );
    expect(savedFrequency).toBe('daily');
  });

  it('should handle service interruptions gracefully', async () => {
    await page.goto(stagingUrl);
    
    // Simulate service interruption by intercepting API calls
    await context.route('**/api/**', route => {
      return route.fulfill({
        status: 503,
        body: 'Service Temporarily Unavailable'
      });
    });
    
    // Attempt sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    await syncButton.click();
    
    // Verify appropriate error handling
    const errorMessage = await page.waitForSelector('[data-testid="sync-error"]');
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('service');
    expect(errorText).toContain('unavailable');
    
    // Verify retry mechanism
    const retryButton = await page.waitForSelector('[data-testid="retry-button"]');
    expect(retryButton).toBeTruthy();
  });
});