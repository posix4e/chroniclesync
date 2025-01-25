import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('History Sync Feature', () => {
  test('should sync browser history', async () => {
    // Launch browser with extension
    const pathToExtension = path.join(__dirname, '../dist');
    const userDataDir = '/tmp/test-user-data-dir';
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Create a page and navigate to some test URLs
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.goto('https://test.com');

    // Open extension popup
    const extensionId = await getExtensionId(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for history sync to complete
    await popup.waitForSelector('[data-testid="history-list"]');

    // Verify history items are displayed
    const historyItems = await popup.locator('[data-testid="history-item"]').count();
    expect(historyItems).toBeGreaterThan(0);

    // Verify specific history entries
    const historyUrls = await popup.locator('[data-testid="history-url"]').allTextContents();
    expect(historyUrls).toContain('https://example.com');
    expect(historyUrls).toContain('https://test.com');

    // Test delete functionality
    await popup.locator('[data-testid="delete-history-item"]').first().click();
    const newHistoryItems = await popup.locator('[data-testid="history-item"]').count();
    expect(newHistoryItems).toBe(historyItems - 1);

    // Test clear all functionality
    await popup.locator('[data-testid="clear-history"]').click();
    await popup.locator('[data-testid="confirm-clear"]').click();
    const finalHistoryItems = await popup.locator('[data-testid="history-item"]').count();
    expect(finalHistoryItems).toBe(0);

    await context.close();
  });
});

async function getExtensionId(context: any): Promise<string> {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  const devMode = await page.locator('#devMode');
  if (await devMode.isVisible()) {
    await devMode.click();
  }
  const id = await page.evaluate(() => {
    const extensions = document.querySelector('extensions-manager')
      ?.shadowRoot?.querySelector('extensions-item-list')
      ?.shadowRoot?.querySelectorAll('extensions-item');
    return Array.from(extensions || [])
      .find((ext: any) => ext.shadowRoot?.textContent.includes('ChronicleSync'))
      ?.getAttribute('id');
  });
  await page.close();
  return id || '';
}