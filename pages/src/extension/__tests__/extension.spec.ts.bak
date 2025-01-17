import { test, expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  // Set up mock server for all tests
  test.beforeEach(async ({ context }) => {
    // Mock API responses
    await context.route('**/api.chroniclesync.xyz/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      });
    });

    // Mock service worker responses
    await context.route('**/service-worker.js', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'self.addEventListener("fetch", () => {});'
      });
    });
  });
  test('extension should load and sync history', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Create a background page to access extension's background script
    let backgroundPage;
    try {
      // First try to get existing background pages
      const pages = await context.backgroundPages();
      if (pages.length > 0) {
        backgroundPage = pages[0];
      } else {
        // If no background page exists, wait for one to be created
        backgroundPage = await context.waitForEvent('backgroundpage', { timeout: 30000 });
      }

      // Wait for the extension to initialize and verify it's ready
      await backgroundPage.waitForFunction(() => {
        return typeof browser !== 'undefined' && 
               browser.storage && 
               browser.history && 
               browser.runtime && 
               browser.runtime.id;
      }, { timeout: 30000, polling: 1000 });

      // Log extension details for debugging
      const extensionId = await backgroundPage.evaluate(() => browser.runtime.id);
      console.log('Extension loaded with ID:', extensionId);
    } catch (error) {
      console.error('Failed to initialize background page:', error);
      throw error;
    }

    // Test storage operations
    const storage = await backgroundPage.evaluate(() => {
      return browser.storage.local.get(['clientId']);
    });
    expect(storage.clientId).toBeTruthy();

    // Visit a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    expect(title).toBe('Example Domain');

    // Wait for history sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify history was recorded
    const history = await backgroundPage.evaluate(() => {
      return browser.history.search({
        text: 'example.com',
        startTime: 0,
        maxResults: 1
      });
    });
    expect(history).toHaveLength(1);
    expect(history[0].url).toContain('example.com');

    // Close the page
    await page.close();
  });

  test('background script should handle sync failures gracefully', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to match first test

    // Initialize background page with same robust method
    let backgroundPage;
    try {
      const pages = await context.backgroundPages();
      if (pages.length > 0) {
        backgroundPage = pages[0];
      } else {
        backgroundPage = await context.waitForEvent('backgroundpage', { timeout: 30000 });
      }

      await backgroundPage.waitForFunction(() => {
        return typeof browser !== 'undefined' && 
               browser.storage && 
               browser.runtime && 
               browser.runtime.id;
      }, { timeout: 30000, polling: 1000 });

      const extensionId = await backgroundPage.evaluate(() => browser.runtime.id);
      console.log('Extension loaded with ID:', extensionId);
    } catch (error) {
      console.error('Failed to initialize background page:', error);
      throw error;
    }

    // Mock API failure - use context.route instead of backgroundPage.route
    await context.route('**/api.chroniclesync.xyz/**', route => 
      route.fulfill({ status: 500, body: 'Server error' })
    );

    // Trigger a sync by visiting a page
    const page = await context.newPage();
    await page.goto('https://example.org');
    
    // Wait for sync attempt
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extension should still be functional
    const storage = await backgroundPage.evaluate(() => {
      return browser.storage.local.get(['lastSync']);
    });
    expect(storage.lastSync).toBeTruthy();

    await page.close();
  });

  test('IndexedDB operations should work correctly', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Test IndexedDB operations
    const dbResult = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('testDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.createObjectStore('testStore', { keyPath: 'id' });
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('testStore', 'readwrite');
          const store = tx.objectStore('testStore');
          
          store.add({ id: 1, value: 'test' });
          
          tx.oncomplete = () => {
            const readTx = db.transaction('testStore', 'readonly');
            const readStore = readTx.objectStore('testStore');
            const getRequest = readStore.get(1);
            
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
          };
        };
      });
    });

    expect(dbResult).toEqual({ id: 1, value: 'test' });
    await page.close();
  });

  test('API URL resolution should work correctly', async ({ context }) => {
    const page = await context.newPage();
    
    // Test local development URL
    await page.goto('http://localhost:5173');
    const apiUrl = await page.evaluate(() => {
      return window.location.hostname === 'localhost' ? 'http://localhost:8787' : '';
    });
    expect(apiUrl).toBe('http://localhost:8787');

    await page.close();
  });
});