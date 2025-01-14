import { test, expect } from '@playwright/test';

test.describe('ChronicleSync Extension Tests', () => {
  test('extension loads and interacts with staging site', async ({ page, context }) => {
    // Navigate to staging site
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({
      path: './tests/screenshots/initial-state.png',
      fullPage: true
    });

    // Wait for extension to be ready
    // Add appropriate selectors based on your extension's UI
    await page.waitForTimeout(2000); // Allow extension to initialize

    // Take screenshot with extension loaded
    await page.screenshot({
      path: './tests/screenshots/extension-loaded.png',
      fullPage: true
    });

    // Basic assertions
    await expect(page).toHaveTitle(/ChronicleSync/);
    
    // Add extension-specific assertions here
    // For example, check if extension button is present
    // await expect(page.locator('#extension-button')).toBeVisible();
  });

  test('extension popup opens and functions', async ({ context }) => {
    // Get the extension background page
    const extensionId = await context.evaluate(() => {
      return new Promise(resolve => {
        chrome.management.getSelf(self => resolve(self.id));
      });
    });

    // Open extension popup
    const extensionPopup = await context.newPage({
      url: `chrome-extension://${extensionId}/popup.html`
    });

    // Take screenshot of popup
    await extensionPopup.screenshot({
      path: './tests/screenshots/extension-popup.png'
    });

    // Add popup-specific tests here
    await extensionPopup.close();
  });
});