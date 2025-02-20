import { test, expect, getExtensionUrl } from './utils/extension';

const TEST_URLS = [
  { url: 'https://example.com', title: 'Example Domain' },
  { url: 'https://www.mozilla.org', title: 'Mozilla' },
  { url: 'https://github.com', title: 'GitHub' }
];

test.describe('History Sync', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Configure extension settings
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.screenshot({ path: 'test-results/settings-initial.png' });

    // Set staging environment
    await settingsPage.selectOption('#environment', 'staging');
    await settingsPage.click('#saveSettings');
    await settingsPage.screenshot({ path: 'test-results/settings-configured.png' });
    await settingsPage.close();
  });

  test('should sync history items to staging server', async ({ context, extensionId }) => {
    // Visit test URLs
    const page = await context.newPage();
    for (const testUrl of TEST_URLS) {
      await page.goto(testUrl.url);
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: `test-results/${new URL(testUrl.url).hostname}.png` });
    }

    // Wait for initial sync (background.js has a delay)
    await page.waitForTimeout(2000);

    // Verify sync status in extension popup
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popupPage.screenshot({ path: 'test-results/popup-after-sync.png' });

    const statusText = await popupPage.textContent('#status');
    expect(statusText).toContain('Last sync:');

    // Trigger manual sync and verify
    await popupPage.click('#syncNow');
    await popupPage.waitForTimeout(1000);
    await popupPage.screenshot({ path: 'test-results/popup-after-manual-sync.png' });

    const newStatusText = await popupPage.textContent('#status');
    expect(newStatusText).toContain('Last sync:');
    expect(Date.parse(newStatusText.split('Last sync:')[1].trim())).toBeGreaterThan(
      Date.parse(statusText.split('Last sync:')[1].trim())
    );
  });

  test('should handle offline sync gracefully', async ({ context, extensionId }) => {
    // Disable network
    await context.setOffline(true);

    // Visit a test URL
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.screenshot({ path: 'test-results/offline-page.png' });

    // Check popup status
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popupPage.screenshot({ path: 'test-results/popup-offline.png' });

    const statusText = await popupPage.textContent('#status');
    expect(statusText).toContain('Offline');

    // Re-enable network
    await context.setOffline(false);
    await popupPage.waitForTimeout(2000);
    await popupPage.screenshot({ path: 'test-results/popup-back-online.png' });

    const newStatusText = await popupPage.textContent('#status');
    expect(newStatusText).toContain('Last sync:');
  });

  test('should sync history across browser restarts', async ({ context, extensionId }) => {
    // Visit initial URLs
    const page = await context.newPage();
    await page.goto(TEST_URLS[0].url);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/initial-visit.png' });

    // Get initial sync status
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    const initialStatus = await popupPage.textContent('#status');
    await popupPage.screenshot({ path: 'test-results/popup-before-restart.png' });

    // Close all pages to simulate browser restart
    const pages = context.pages();
    await Promise.all(pages.map(p => p.close()));

    // Visit more URLs after "restart"
    const newPage = await context.newPage();
    await newPage.goto(TEST_URLS[1].url);
    await newPage.waitForTimeout(2000);
    await newPage.screenshot({ path: 'test-results/after-restart-visit.png' });

    // Check sync status after "restart"
    const newPopupPage = await context.newPage();
    await newPopupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await newPopupPage.screenshot({ path: 'test-results/popup-after-restart.png' });

    const finalStatus = await newPopupPage.textContent('#status');
    expect(Date.parse(finalStatus.split('Last sync:')[1].trim())).toBeGreaterThan(
      Date.parse(initialStatus.split('Last sync:')[1].trim())
    );
  });
});