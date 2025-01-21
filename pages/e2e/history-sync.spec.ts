import { test, expect } from './utils/extension';
import { HistoryItem } from '../src/types';

test.describe('History Sync', () => {
  test('should collect and store browser history', async ({ page, context }) => {
    // Mock chrome.history API
    await context.addInitScript(() => {
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example Site',
          visitTime: Date.now() - 3600000, // 1 hour ago
          typedCount: 5,
          lastVisitTime: Date.now() - 3600000,
        },
        {
          id: '2',
          url: 'https://test.com',
          title: 'Test Site',
          visitTime: Date.now() - 7200000, // 2 hours ago
          typedCount: 3,
          lastVisitTime: Date.now() - 7200000,
        },
      ];

      (window as any).chrome = {
        history: {
          search: (
            query: chrome.history.HistoryQuery,
            callback: (results: chrome.history.HistoryItem[]) => void
          ) => {
            callback(mockHistory);
          },
        },
      };
    });

    // Wait for the extension to load
    await page.waitForLoadState('networkidle');

    // Check if history is stored in IndexedDB
    const historyItems = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('sync_test-client', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      return new Promise<HistoryItem[]>((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    });

    expect(historyItems).toHaveLength(2);
    expect(historyItems[0].url).toBe('https://example.com');
    expect(historyItems[1].url).toBe('https://test.com');
  });

  test('should include browser metadata with history', async ({ page, context }) => {
    // Mock navigator properties
    await context.addInitScript(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true,
      });
    });

    // Wait for the extension to load
    await page.waitForLoadState('networkidle');

    // Check if metadata is correctly collected
    const metadata = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('sync_test-client', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readonly');
          const store = transaction.objectStore('data');
          const dataRequest = store.get('browserMetadata');
          dataRequest.onsuccess = () => resolve(dataRequest.result);
        };
      });
    });

    expect(metadata).toBeDefined();
    expect(metadata.browserName).toBe('chrome');
    expect(metadata.osName).toBe('windows');
    expect(metadata.platform).toBe('Win32');
    expect(metadata.vendor).toBe('Google Inc.');
  });

  test('should handle multiple browsers syncing history', async ({ browser }) => {
    // Create two browser contexts to simulate different browsers
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Mock different browser metadata for each context
    await contextA.addInitScript(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        configurable: true,
      });
    });

    await contextB.addInitScript(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/89.0',
        configurable: true,
      });
    });

    // Load extension in both contexts
    await pageA.goto('chrome-extension://[extension-id]/popup.html');
    await pageB.goto('chrome-extension://[extension-id]/popup.html');

    // Wait for both pages to be ready
    await Promise.all([
      pageA.waitForLoadState('networkidle'),
      pageB.waitForLoadState('networkidle'),
    ]);

    // Check if both browsers' data is stored correctly
    const metadataA = await pageA.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('sync_test-client', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readonly');
          const store = transaction.objectStore('data');
          const dataRequest = store.get('browserMetadata');
          dataRequest.onsuccess = () => resolve(dataRequest.result);
        };
      });
    });

    const metadataB = await pageB.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('sync_test-client', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['data'], 'readonly');
          const store = transaction.objectStore('data');
          const dataRequest = store.get('browserMetadata');
          dataRequest.onsuccess = () => resolve(dataRequest.result);
        };
      });
    });

    expect(metadataA.browserName).toBe('chrome');
    expect(metadataB.browserName).toBe('firefox');

    await contextA.close();
    await contextB.close();
  });
});