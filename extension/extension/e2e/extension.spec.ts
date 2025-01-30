import { test, expect, getExtensionUrl } from './utils/test-utils';
import ExtensionPage from './utils/extension';

test.describe('ChronicleSync Extension', () => {
  let extensionPage: ExtensionPage;

  test.beforeEach(async ({ context }) => {
    extensionPage = await ExtensionPage.create(context);
    context.on('page', page => {
      page.on('dialog', dialog => dialog.accept());
    });
  });

  test('settings workflow', async ({ context, extensionId }) => {
    // 1. First Time Setup
    test.step('opens settings on first install', async () => {
      await extensionPage.simulateFirstInstall();
      const settingsPage = await context.waitForEvent('page');
      await settingsPage.waitForSelector('#settings-container');
      
      await settingsPage.screenshot({
        path: './test-results/01-first-time-settings.png'
      });

      // Fill and save settings
      await settingsPage.fill('#apiEndpoint', 'https://api.chroniclesync.xyz');
      await settingsPage.fill('#pagesUrl', 'https://chroniclesync.pages.dev');
      await settingsPage.fill('#clientId', 'test-client-id');
      await settingsPage.click('button[type="submit"]');
      
      await settingsPage.screenshot({
        path: './test-results/02-settings-saved.png'
      });

      // Verify success
      await expect(settingsPage.locator('#settings-message.success')).toBeVisible();
    });

    // 2. Extension Popup
    test.step('initializes client ID', async () => {
      const popup = await context.newPage();
      await popup.goto(getExtensionUrl(extensionId, 'popup.html'));
      
      await popup.screenshot({
        path: './test-results/03-popup-initial.png'
      });

      await popup.fill('#clientId', 'test-client-id');
      await popup.click('button:has-text("Initialize")');
      
      await popup.screenshot({
        path: './test-results/04-popup-initialized.png'
      });

      // Verify state
      const settings = await extensionPage.getStoredSettings();
      expect(settings.firstTimeSetupComplete).toBe(true);
      expect(settings.clientId).toBe('test-client-id');
    });

    // 3. Settings Access
    test.step('can access settings from popup', async () => {
      const popup = await context.newPage();
      await popup.goto(getExtensionUrl(extensionId, 'popup.html'));
      await popup.click('.settings-button');
      
      const settingsPage = await context.waitForEvent('page');
      await settingsPage.waitForSelector('#settings-container');
      
      await settingsPage.screenshot({
        path: './test-results/05-settings-from-popup.png'
      });

      // Verify settings are loaded
      await expect(settingsPage.locator('#apiEndpoint')).toHaveValue('https://api.chroniclesync.xyz');
      await expect(settingsPage.locator('#pagesUrl')).toHaveValue('https://chroniclesync.pages.dev');
      await expect(settingsPage.locator('#clientId')).toHaveValue('test-client-id');
    });
  });

  test.afterEach(async ({ }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const screenshot = await extensionPage['page'].screenshot({
        path: `./test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`,
        fullPage: true
      });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
    }
  });
});
