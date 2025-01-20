import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

async function setupExtension(): Promise<BrowserContext> {
  const extensionPath = path.join(__dirname, '../../dist');
  console.log('Extension path:', extensionPath);
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Wait for extension to be loaded
  const extensions = await context.backgroundPages();
  console.log('Loaded extensions:', extensions.length);
  if (extensions.length === 0) {
    throw new Error('Extension not loaded properly');
  }
  
  return context;
}

test.describe('History Sync', () => {
  test('should sync browser history', async () => {
    const context = await setupExtension();

    // Create a new page and visit some URLs
    const page = await context.newPage();
    
    // Create screenshot directories
    await page.evaluate(() => {
      const fs = require('fs');
      fs.mkdirSync('../pages/test-results', { recursive: true });
      fs.mkdirSync('test-results', { recursive: true });
    });

    // Visit test pages and capture screenshots
    console.log('Visiting example.com...');
    await page.goto('https://example.com');
    await page.screenshot({ path: '../pages/test-results/history-first-visit.png' });
    await page.screenshot({ path: 'test-results/history-first-visit.png' });
    
    console.log('Visiting test.com...');
    await page.goto('https://test.com');
    await page.screenshot({ path: '../pages/test-results/history-second-visit.png' });
    await page.screenshot({ path: 'test-results/history-second-visit.png' });
    
    // Wait for history sync to complete
    console.log('Waiting for sync...');
    await page.waitForTimeout(1000);
    
    // Open Chrome History page to verify entries
    console.log('Opening Chrome History...');
    await page.goto('chrome://history');
    await page.screenshot({ path: '../pages/test-results/chrome-history-page.png' });
    await page.screenshot({ path: 'test-results/chrome-history-page.png' });

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

  test('should encrypt history data', async () => {
    const context = await setupExtension();

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
    await storagePage.screenshot({ path: 'test-results/encrypted-storage-data.png' });

    await context.close();
  });
});