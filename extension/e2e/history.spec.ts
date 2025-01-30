import { test, expect } from '@playwright/test';
import { chromium, BrowserContext } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    if (!extensionId) {
      throw new Error('Could not find extension ID');
    }
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
    if (!pagesUrl) {
      throw new Error('Could not find pages URL');
    }
    await page.goto(pagesUrl);

    // Take screenshot of history view
    await page.screenshot({ path: 'history-view.png' });

    // Verify history entries are present
    const historyEntries = await page.$$('.history-entry');
    expect(historyEntries.length).toBeGreaterThan(0);

    await browser.close();
  });
});

async function getExtensionId(context: BrowserContext): Promise<string | null> {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  
  // Wait for the extensions page to load
  await page.waitForTimeout(1000);

  // Try to enable developer mode if needed
  try {
    const devMode = await page.$('text=Developer mode');
    if (devMode) {
      await devMode.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('Developer mode might already be enabled');
  }

  // Get extension ID using the extension name
  const id = await page.evaluate(() => {
    const extensions = Array.from(document.querySelectorAll('extensions-item'));
    for (const extension of extensions) {
      const name = extension.querySelector('#name')?.textContent;
      if (name?.includes('ChronicleSync')) {
        return extension.getAttribute('id');
      }
    }
    return null;
  });

  await page.close();
  
  if (!id) {
    throw new Error('Could not find ChronicleSync extension');
  }
  
  return id;
}