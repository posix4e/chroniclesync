import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';

test.describe('History Sync Feature', () => {
  test('should sync history and display in pages UI', async () => {
    // Load the extension
    const pathToExtension = path.join(__dirname, '../');
    const userDataDir = '/tmp/test-user-data-dir';
    
    const browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to some test pages to create history
    await page.goto('https://example.com');
    await page.goto('https://test.com');

    // Open extension popup
    const extensionId = await getExtensionId(browser);
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Set client ID in settings
    await popupPage.click('text=Settings');
    await popupPage.fill('#clientId', 'test-client-id');
    await popupPage.click('text=Save Settings');

    // Verify success message
    const message = await popupPage.textContent('.message');
    expect(message).toContain('Settings saved successfully');

    // Navigate to pages UI
    const pagesUrl = await popupPage.getAttribute('#pagesUrl', 'value');
    await page.goto(pagesUrl);

    // Take screenshot of history view
    await page.screenshot({ path: 'history-view.png' });

    // Verify history entries are present
    const historyEntries = await page.$$('.history-entry');
    expect(historyEntries.length).toBeGreaterThan(0);

    await browser.close();
  });
});

async function getExtensionId(context) {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  const devMode = await page.$('text=Developer mode');
  if (devMode) await devMode.click();
  const id = await page.evaluate(() => {
    const extensions = document.querySelector('extensions-manager').shadowRoot
      .querySelector('extensions-item-list').shadowRoot
      .querySelectorAll('extensions-item');
    for (const extension of extensions) {
      if (extension.shadowRoot.querySelector('[title="ChronicleSync Extension"]')) {
        return extension.id;
      }
    }
  });
  await page.close();
  return id;
}