import { test, expect, getExtensionUrl } from './utils/test-utils';
import ExtensionPage from './utils/extension';

test.describe('Settings Workflow', () => {
  let extensionPage: ExtensionPage;

  test.beforeEach(async ({ context }) => {
    extensionPage = await ExtensionPage.create(context);
  });

  test('opens settings on first install', async ({ page }) => {
    // Trigger first install
    await extensionPage.simulateFirstInstall();
    
    // Wait for settings page to open
    await page.waitForSelector('#settings-container');
    
    // Take screenshot of settings page on first install
    await page.screenshot({
      path: './test-results/settings-first-install.png',
      fullPage: true
    });
  });

  test('saves settings and opens pages URL', async ({ page }) => {
    // Open settings
    await extensionPage.openSettings();
    
    // Fill out settings form
    await page.fill('#apiEndpoint', 'https://api.chroniclesync.xyz');
    await page.fill('#pagesUrl', 'https://chroniclesync.pages.dev');
    await page.fill('#clientId', 'test-client-id');

    // Take screenshot before saving
    await page.screenshot({
      path: './test-results/settings-filled.png',
      fullPage: true
    });

    // Save settings
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('#settings-message.success')).toBeVisible();

    // Take screenshot of success state
    await page.screenshot({
      path: './test-results/settings-saved.png',
      fullPage: true
    });

    // Verify pages URL opens with clientId
    const pagesPage = await page.waitForEvent('popup');
    await expect(pagesPage.url()).toContain('clientId=test-client-id');
  });

  test('resets settings to defaults', async ({ page }) => {
    // Open settings
    await extensionPage.openSettings();
    
    // Fill out settings form with custom values
    await page.fill('#apiEndpoint', 'https://custom-api.chroniclesync.xyz');
    await page.fill('#pagesUrl', 'https://custom.chroniclesync.pages.dev');
    await page.fill('#clientId', 'custom-client-id');

    // Take screenshot of custom settings
    await page.screenshot({
      path: './test-results/settings-custom.png',
      fullPage: true
    });

    // Click reset button and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.click('#reset-settings');

    // Verify default values are restored
    await expect(page.locator('#apiEndpoint')).toHaveValue('https://api.chroniclesync.xyz');
    await expect(page.locator('#pagesUrl')).toHaveValue('https://chroniclesync.pages.dev');
    await expect(page.locator('#clientId')).toHaveValue('extension-default');

    // Take screenshot of reset state
    await page.screenshot({
      path: './test-results/settings-reset.png',
      fullPage: true
    });
  });

  test('validates required fields', async ({ page }) => {
    // Open settings
    await extensionPage.openSettings();
    
    // Clear all fields
    await page.fill('#apiEndpoint', '');
    await page.fill('#pagesUrl', '');
    await page.fill('#clientId', '');

    // Try to save
    await page.click('button[type="submit"]');

    // Take screenshot showing validation errors
    await page.screenshot({
      path: './test-results/settings-validation.png',
      fullPage: true
    });

    // Verify form wasn't submitted
    await expect(page.locator('#settings-message.error')).toBeVisible();
  });
});