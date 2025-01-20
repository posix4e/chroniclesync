import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('History Sync', () => {
  test('should sync browser history', async ({ context }) => {
    // Load the extension
    const extensionPath = path.join(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // Create a new page and visit some URLs
    const page = await context.newPage();
    
    // Visit test pages and capture screenshots
    await page.goto('https://example.com');
    await page.screenshot({ path: '../pages/test-results/history-first-visit.png' });
    
    await page.goto('https://test.com');
    await page.screenshot({ path: '../pages/test-results/history-second-visit.png' });
    
    // Wait for history sync to complete
    // We'll need to implement a way to check this, possibly through extension storage
    await page.waitForTimeout(1000);
    
    // Open Chrome History page to verify entries
    await page.goto('chrome://history');
    await page.screenshot({ path: '../pages/test-results/chrome-history-page.png' });

    // Get the extension background page
    const backgroundPages = context.backgroundPages();
    const extensionId = backgroundPages[0].url().split('/')[2];
    
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

    await context.close();
  });

  test('should encrypt history data', async ({ context }) => {
    // Load the extension
    const extensionPath = path.join(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

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
    await storagePage.screenshot({ path: '../pages/test-results/encrypted-storage-data.png' });

    await context.close();
  });
});