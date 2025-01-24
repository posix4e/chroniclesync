import { test, expect } from './utils/extension';
import { getExtensionId } from './utils/extension';

test.describe('Extension Background', () => {
  test('background script loads correctly', async ({ context, serviceWorker }) => {
    const workers = context.serviceWorkers();
    expect(workers.length).toBe(1);
    expect(workers[0].url()).toContain('background.js');
    
    const extensionId = await getExtensionId(context);
    expect(extensionId).not.toBe('unknown-extension-id');
  });

  test('manifest permissions are correct', async ({ serviceWorker }) => {
    const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest());
    
    expect(manifest.permissions).toContain('history');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.background).toBeDefined();
    expect(manifest.background && 'service_worker' in manifest.background && manifest.background.service_worker).toBe('dist/background.js');
  });

  test('history sync message handling', async ({ context, serviceWorker }) => {
    const extensionPage = await context.newPage();

    // Navigate to extension page
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.waitForSelector('.history-sync');
    
    // Take screenshot before sync
    await extensionPage.screenshot({ 
      path: 'test-results/before-sync.png',
      fullPage: true 
    });

    // Test history sync
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync History');
    const dialog = await dialogPromise;
    
    expect(dialog.message()).toContain('History sync completed successfully');
    await dialog.dismiss();

    // Wait for sync to complete and take screenshot
    await extensionPage.waitForTimeout(1000); // Wait for UI updates
    await extensionPage.screenshot({ 
      path: 'test-results/after-sync.png',
      fullPage: true 
    });
  });
});