import { test, expect } from '@playwright/test';

test.describe('ChronicleSync Extension Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Ensure clean state for IndexedDB
    await context.clearPermissions();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('extension loads and interacts with staging site', async ({ page, context }) => {
    // Navigate to staging site
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({
      path: './tests/screenshots/01-initial-state.png',
      fullPage: true
    });

    // Wait for extension to initialize
    await page.waitForTimeout(2000);

    // Take screenshot with extension loaded
    await page.screenshot({
      path: './tests/screenshots/02-extension-loaded.png',
      fullPage: true
    });

    // Basic assertions
    await expect(page).toHaveTitle(/ChronicleSync/);
  });

  test('extension popup functionality', async ({ context }) => {
    // Get the extension background page
    const backgroundPages = context.backgroundPages();
    const extensionId = backgroundPages.length > 0 
      ? backgroundPages[0].url().split('/')[2]
      : await context.evaluate(() => {
          return new Promise(resolve => {
            chrome.management.getSelf(self => resolve(self.id));
          });
        });

    // Open extension popup
    const popup = await context.newPage({
      url: `chrome-extension://${extensionId}/popup.html`
    });

    // Wait for popup to load
    await popup.waitForLoadState('domcontentloaded');
    
    // Take screenshot of popup
    await popup.screenshot({
      path: './tests/screenshots/03-extension-popup.png'
    });

    // Add popup interaction tests here
    // For example:
    // await popup.click('#settings-button');
    // await popup.screenshot({ path: './tests/screenshots/04-popup-settings.png' });

    await popup.close();
  });

  test('IndexedDB interaction', async ({ page }) => {
    // Navigate to a page that uses IndexedDB
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monitor IndexedDB operations
    await page.evaluate(() => {
      return new Promise(resolve => {
        const request = indexedDB.open('ChronicleSync', 1);
        request.onerror = () => resolve('Error opening IndexedDB');
        request.onsuccess = () => resolve('Successfully opened IndexedDB');
      });
    });

    // Take screenshot after IndexedDB initialization
    await page.screenshot({
      path: './tests/screenshots/05-indexeddb-initialized.png',
      fullPage: true
    });

    // Add more IndexedDB-specific tests here
  });
});