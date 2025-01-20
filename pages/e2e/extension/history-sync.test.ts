import { test, expect } from '../utils/extension';

test.describe('History Sync', () => {
  test.beforeEach(async ({ context }) => {
    // Create test-results directory
    const page = await context.newPage();
    await page.evaluate(() => {
      const fs = require('fs');
      fs.mkdirSync('test-results', { recursive: true });
    });
    await page.close();
  });

  test('should sync browser history', async ({ context }) => {
    const page = await context.newPage();

    // Visit test pages and capture screenshots
    console.log('Visiting example.com...');
    await page.goto('https://example.com');
    await page.screenshot({ path: 'test-results/history-first-visit.png' });
    
    console.log('Visiting test.com...');
    await page.goto('https://test.com');
    await page.screenshot({ path: 'test-results/history-second-visit.png' });
    
    // Wait for history sync to complete
    console.log('Waiting for sync...');
    await page.waitForTimeout(1000);
    
    // Open Chrome History page to verify entries
    console.log('Opening Chrome History...');
    await page.goto('chrome://history');
    await page.screenshot({ path: 'test-results/chrome-history-page.png' });

    // Check IndexedDB for synced history
    const storageData = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('ChronicleSync', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('syncData', 'readonly');
          const store = tx.objectStore('syncData');
          const items = [];
          
          store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
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

    // Verify that history items were synced
    expect(storageData).toContainEqual(
      expect.objectContaining({
        key: expect.stringContaining('history:'),
        synced: expect.any(Boolean)
      })
    );
  });

  test('should encrypt history data', async ({ context }) => {
    const page = await context.newPage();
    
    // Visit a test page
    await page.goto('https://example.com');
    
    // Wait for sync
    await page.waitForTimeout(1000);

    // Get stored data
    const storageData = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('ChronicleSync', 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('syncData', 'readonly');
          const store = tx.objectStore('syncData');
          
          store.getAll().onsuccess = (event) => {
            resolve(event.target.result);
          };
        };
      });
    });

    // Verify data is encrypted
    for (const item of storageData) {
      // Encrypted data should be a base64 string
      expect(item.data).toMatch(/^[A-Za-z0-9+/=]+$/);
      
      // Encrypted data should not contain the URL in plaintext
      expect(item.data).not.toContain('example.com');
    }

    // Take a screenshot of the storage data for verification
    const storagePage = await context.newPage();
    await storagePage.setContent(`
      <pre style="white-space: pre-wrap; word-wrap: break-word;">
        ${JSON.stringify(storageData, null, 2)}
      </pre>
    `);
    await storagePage.screenshot({ path: 'test-results/encrypted-storage-data.png' });
  });
});