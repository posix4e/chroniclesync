import { test, expect } from '../utils/extension';

test.describe('History Sync', () => {
  test('should sync browser history', async ({ context, extensionId }) => {
    // Create a new page and visit some test sites
    const page = await context.newPage();
    
    // Visit a reliable test site
    await page.goto('https://example.com', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for history sync to process
    await page.waitForTimeout(2000);

    // Open extension page to access IndexedDB
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('networkidle');

    // Check IndexedDB for synced history
    const storageData = await extensionPage.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('ChronicleSync', 1);
        
        request.onerror = () => resolve([]);
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('syncData', 'readonly');
          const store = tx.objectStore('syncData');
          const items: Array<{ key: string; data: string }> = [];
          
          store.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              items.push(cursor.value);
              cursor.continue();
            } else {
              resolve(items);
            }
          };
        };
      });
    });

    // Verify that at least one history item was synced
    expect(storageData.some(item => item.key.startsWith('history:'))).toBeTruthy();
  });

  test('should encrypt history data', async ({ context, extensionId }) => {
    // Create a new page and visit some test sites
    const page = await context.newPage();
    
    // Visit a test site
    await page.goto('https://example.com', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Open extension page to access IndexedDB
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('networkidle');

    // Get stored data
    const storageData = await extensionPage.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('ChronicleSync', 1);
        
        request.onerror = () => resolve([]);
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('syncData', 'readonly');
          const store = tx.objectStore('syncData');
          
          store.getAll().onsuccess = (event) => {
            resolve((event.target as IDBRequest).result);
          };
        };
      });
    });

    // Verify data encryption
    const historyItems = storageData.filter(item => item.key.startsWith('history:'));
    expect(historyItems.length).toBeGreaterThan(0);

    for (const item of historyItems) {
      // Encrypted data should be a base64 string
      expect(item.data).toMatch(/^[A-Za-z0-9+/=]+$/);
      
      // Encrypted data should not contain the URL in plaintext
      expect(item.data).not.toContain('example.com');
    }
  });
});