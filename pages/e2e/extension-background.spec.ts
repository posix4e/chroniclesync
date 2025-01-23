import { test, expect } from './utils/extension';
import { getExtensionId } from './utils/extension';

test.describe('Extension Background', () => {
  test('background script loads correctly', async ({ context }) => {
    const backgroundPages = context.backgroundPages();
    expect(backgroundPages.length).toBe(1);
    
    const extensionId = await getExtensionId(context);
    expect(extensionId).not.toBe('unknown-extension-id');
  });

  test('manifest permissions are correct', async ({ context }) => {
    const [background] = context.backgroundPages();
    const manifest = await background.evaluate(() => chrome.runtime.getManifest());
    
    expect(manifest.permissions).toContain('history');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.background).toBeDefined();
    expect(manifest.background && 'service_worker' in manifest.background && manifest.background.service_worker).toBe('dist/background.js');
  });

  test('history sync message handling', async ({ context }) => {
    const [background] = context.backgroundPages();
    const extensionPage = await context.newPage();
    
    // Mock history API
    await background.evaluate(() => {
      (window as any).chrome.history = {
        search: () => Promise.resolve([
          { id: '1', url: 'https://example.com', title: 'Example', lastVisitTime: Date.now() }
        ]),
        addUrl: () => Promise.resolve()
      };
    });

    // Mock API responses
    await extensionPage.route('**/history/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await extensionPage.route('**/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: '2', url: 'https://other.com', title: 'Other', visitTime: Date.now(), deviceId: 'other-device' }
          ]
        })
      });
    });

    // Take screenshot of extension page
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.screenshot({ path: 'test-results/extension-page.png' });

    // Test history sync
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync History');
    const dialog = await dialogPromise;
    
    expect(dialog.message()).toContain('History sync completed successfully');
    await dialog.dismiss();
  });
});