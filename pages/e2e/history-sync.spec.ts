import { test, expect } from './utils/extension';

interface HistoryEntry {
  timestamp: number;
  action: string;
  data: unknown;
  clientId: string;
}

test.describe('History Sync', () => {
  test('should sync history between browser and extension with real navigation', async ({ page, context }) => {
    // Open extension popup directly from extension directory
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForTimeout(1000);

    // Delete existing databases first
    await popupPage.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('sync_test-client-1');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });

    // Wait for the extension to be ready
    await popupPage.waitForFunction(() => window.chronicleSync && window.chronicleSync.db);

    // Initialize the client
    await popupPage.evaluate(async () => {
      const db = window.chronicleSync.db;
      await db.init('test-client-1');
    });

    // Create a new page for navigation testing
    const navPage = await context.newPage();
    
    // Navigate to different pages
    await navPage.goto('https://example.com');
    await navPage.goto('https://example.org');
    await navPage.waitForTimeout(1000);

    // Verify navigation history was recorded
    const history = await popupPage.evaluate<Promise<HistoryEntry[]>>(async () => {
      const db = (window as any).chronicleSync.db;
      return await db.getHistory();
    });

    expect(history).toHaveLength(2);
    expect(history[0].action).toBe('navigation');
    expect(history[0].data).toEqual({ url: 'https://example.com' });
    expect(history[1].action).toBe('navigation');
    expect(history[1].data).toEqual({ url: 'https://example.org' });

    // Open a new tab and verify history is synced
    const newPage = await context.newPage();
    await newPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(1000);

    // Initialize the new client and verify history
    const syncedHistory = await newPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      await db.init('test-client-1');
      return await db.getHistory();
    });

    expect(syncedHistory).toHaveLength(2);
    expect(syncedHistory[0].data).toEqual({ url: 'https://example.com' });
    expect(syncedHistory[1].data).toEqual({ url: 'https://example.org' });

    // Navigate in a new tab
    const newNavPage = await context.newPage();
    await newNavPage.goto('https://example.net');
    await newNavPage.waitForTimeout(1000);

    // Verify history is updated in both extension instances
    const [updatedHistory1, updatedHistory2] = await Promise.all([
      popupPage.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      }),
      newPage.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      })
    ]);

    expect(updatedHistory1).toHaveLength(3);
    expect(updatedHistory2).toHaveLength(3);
    expect(updatedHistory1[2].data).toEqual({ url: 'https://example.net' });
    expect(updatedHistory2[2].data).toEqual({ url: 'https://example.net' });

    // Test history filtering by timestamp
    const recentHistory = await popupPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      const oneMinuteAgo = Date.now() - 60000;
      return await db.getHistory(oneMinuteAgo);
    });

    expect(recentHistory.length).toBeLessThanOrEqual(3);
    expect(recentHistory[recentHistory.length - 1].data).toEqual({ url: 'https://example.net' });

    // Test browser history integration
    interface ChromeHistoryItem {
      url: string;
      title?: string;
      lastVisitTime?: number;
      visitCount?: number;
    }

    const browserHistory = await navPage.evaluate<Promise<ChromeHistoryItem[]>>(async () => {
      return await new Promise<ChromeHistoryItem[]>(resolve => {
        chrome.history.search({ text: '', maxResults: 10 }, results => {
          resolve(results.filter(item => item.url !== undefined) as ChromeHistoryItem[]);
        });
      });
    });

    const urls = browserHistory.map(entry => entry.url);
    expect(urls).toContain('https://example.com');
    expect(urls).toContain('https://example.org');
    expect(urls).toContain('https://example.net');
  });

  test('should handle concurrent updates', async ({ page, context }) => {
    const popupPage1 = await context.newPage();
    const popupPage2 = await context.newPage();

    await Promise.all([
      popupPage1.goto(`file://${process.cwd()}/../extension/popup.html`),
      popupPage2.goto(`file://${process.cwd()}/../extension/popup.html`)
    ]);

    await Promise.all([
      popupPage1.waitForLoadState('networkidle'),
      popupPage2.waitForLoadState('networkidle')
    ]);

    // Delete existing databases first
    await Promise.all([
      popupPage1.evaluate(async () => {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase('sync_test-client-1');
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        });
      }),
      popupPage2.evaluate(async () => {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase('sync_test-client-2');
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        });
      })
    ]);

    // Initialize DBs with different client IDs
    await Promise.all([
      popupPage1.evaluate(async () => {
        const db = window.chronicleSync.db;
        await db.init('test-client-1');
      }),
      popupPage2.evaluate(async () => {
        const db = window.chronicleSync.db;
        await db.init('test-client-2');
      })
    ]);

    // Make concurrent updates
    await Promise.all([
      popupPage1.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.setData({ from: 'client1' });
      }),
      popupPage2.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.setData({ from: 'client2' });
      })
    ]);

    // Wait for sync
    await page.waitForTimeout(1000);

    // Verify history in both clients
    const [history1, history2] = await Promise.all([
      popupPage1.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      }),
      popupPage2.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      })
    ]);

    // Each client should see their own updates
    expect(history1).toHaveLength(1);
    expect(history2).toHaveLength(1);

    // Verify client IDs are preserved
    expect(history1[0].clientId).toBe('test-client-1');
    expect(history2[0].clientId).toBe('test-client-2');

    // Verify data is correct
    expect(history1[0].data).toEqual({ from: 'client1' });
    expect(history2[0].data).toEqual({ from: 'client2' });
  });
});