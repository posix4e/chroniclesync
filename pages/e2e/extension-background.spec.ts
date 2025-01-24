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
    const testHistoryItems = [
      { id: '1', url: 'https://example.com', title: 'Local Example', lastVisitTime: Date.now() },
      { id: '2', url: 'https://test.com', title: 'Local Test', lastVisitTime: Date.now() }
    ];
    
    // Mock history API
    await background.evaluate((items: Array<{ id: string; url: string; title: string; lastVisitTime: number }>) => {
      interface HistoryItem {
        id: string;
        url: string;
        title: string;
        lastVisitTime: number;
      }

      interface HistoryVisit {
        visitTime: number;
      }

      const historyItems = new Map<string, HistoryItem>(items.map(item => [item.url, item]));
      (window as any).chrome.history = {
        search: () => Promise.resolve(items),
        addUrl: async ({ url }: { url: string }) => {
          historyItems.set(url, {
            id: Math.random().toString(36).substring(2),
            url,
            title: `Added ${url}`,
            lastVisitTime: Date.now()
          });
          return Promise.resolve();
        },
        getVisits: async ({ url }: { url: string }): Promise<HistoryVisit[]> => {
          const item = historyItems.get(url);
          return Promise.resolve(item ? [{ visitTime: item.lastVisitTime }] : []);
        }
      };
    }, testHistoryItems);

    let syncCount = 0;
    const remoteHistoryItems = [
      { id: '3', url: 'https://remote.com', title: 'Remote Site', visitTime: Date.now(), deviceId: 'other-device' },
      { id: '4', url: 'https://another.com', title: 'Another Remote', visitTime: Date.now(), deviceId: 'other-device' }
    ];

    // Mock API responses
    await extensionPage.route('**/history/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await extensionPage.route('**/history', async route => {
      syncCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: syncCount === 1 ? [] : remoteHistoryItems
        })
      });
    });

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

    // Verify remote items were added
    const addedUrls = await background.evaluate(() => {
      return (window as any).chrome.history.search({ text: '', maxResults: 100 })
        .then((items: any[]) => items.map(i => i.url));
    });

    expect(addedUrls).toContain('https://remote.com');
    expect(addedUrls).toContain('https://another.com');
  });
});