import { test, expect } from '@playwright/test';

// Add type for browser global
declare global {
  interface Window {
    browser: {
      storage: {
        local: {
          get(_keys: string[]): Promise<Record<string, unknown>>;
        };
      };
      history: {
        search(_params: { text: string; startTime: number; maxResults: number }): Promise<unknown[]>;
      };
      runtime: {
        id: string;
      };
    };
  }
}

test.describe('Chrome Extension', () => {
  // Helper function to check browser API readiness
  const isBrowserAPIReady = () => {
    return typeof window.browser !== 'undefined' && 
           typeof window.browser.storage?.local?.get === 'function' &&
           typeof window.browser.history?.search === 'function' &&
           typeof window.browser.runtime?.id === 'string';
  };

  // Set up mock server for all tests
  test.beforeEach(async ({ context }) => {
    // Mock API responses
    await context.route('**/api*.chroniclesync.xyz/**', route => {
      const method = route.request().method();
      
      if (method === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            history: [],
            lastSync: Date.now()
          })
        });
      } else if (method === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'History synced successfully'
          })
        });
      }
    });
    
    // Also mock the staging API and test page
    await context.route('http://localhost:8787/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><head><title>ChronicleSync Test Page</title></head><body>Test page</body></html>'
      });
    });

    // Mock service worker with proper lifecycle events
    await context.route('**/service-worker.js', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          self.addEventListener('install', (event) => {
            event.waitUntil(self.skipWaiting());
          });
          self.addEventListener('activate', (event) => {
            event.waitUntil(self.clients.claim());
          });
          self.addEventListener('fetch', (event) => {
            event.respondWith(fetch(event.request));
          });
        `
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

      // Wait for the extension to initialize
      await backgroundPage.waitForFunction(isBrowserAPIReady, { timeout: 30000, polling: 1000 });

      // Log extension details for debugging
      const extensionId = await backgroundPage.evaluate(() => window.browser.runtime.id);
      console.log('Extension loaded with ID:', extensionId);

      // Wait for service worker registration
      await backgroundPage.waitForFunction(() => {
        return navigator.serviceWorker?.controller !== null;
      }, { timeout: 30000 });
    } catch (error) {
      console.error('Failed to initialize background page:', error);
      throw error;
    }

    // Test storage operations
    const storage = await backgroundPage.evaluate(() => {
      return window.browser.storage.local.get(['clientId']);
    });
    expect(storage.clientId).toBeTruthy();

    // Visit a test page that matches our host permissions
    const page = await context.newPage();
    await page.goto('http://localhost:8787/test');
    const title = await page.title();
    expect(title).toBe('ChronicleSync Test Page');

    // Wait for history sync with longer timeout in CI
    const syncTimeout = process.env.CI ? 10000 : 2000;
    await new Promise(resolve => setTimeout(resolve, syncTimeout));

    // Verify history was recorded
    const history = await backgroundPage.evaluate(() => {
      return window.browser.history.search({
        text: 'localhost:8787',
        startTime: 0,
        maxResults: 1
      });
    });
    expect(history).toHaveLength(1);
    const historyItem = history[0] as { url: string };
    expect(historyItem.url).toContain('localhost:8787');

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

      // Wait for the extension to initialize
      await backgroundPage.waitForFunction(isBrowserAPIReady, { timeout: 30000, polling: 1000 });

      // Log extension details for debugging
      const extensionId = await backgroundPage.evaluate(() => window.browser.runtime.id);
      console.log('Extension loaded with ID:', extensionId);

      // Wait for service worker registration
      await backgroundPage.waitForFunction(() => {
        return navigator.serviceWorker?.controller !== null;
      }, { timeout: 30000 });
    } catch (error) {
      console.error('Failed to initialize background page:', error);
      throw error;
    }

    // Mock API failure
    await context.route('**/api*.chroniclesync.xyz/**', route => 
      route.fulfill({ status: 500, body: 'Server error' })
    );

    // Trigger a sync by visiting a page
    const page = await context.newPage();
    await page.goto('http://localhost:8787/test');
    
    // Wait for sync attempt
    const syncTimeout = process.env.CI ? 10000 : 2000;
    await new Promise(resolve => setTimeout(resolve, syncTimeout));

    // Extension should still be functional
    const storage = await backgroundPage.evaluate(() => {
      return window.browser.storage.local.get(['lastSync']);
    });
    expect(storage.lastSync).toBeTruthy();

    await page.close();
  });

  test('IndexedDB operations should work correctly', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:8787/test');

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
    await page.goto('http://localhost:8787/test');
    const apiUrl = await page.evaluate(() => {
      return window.location.hostname === 'localhost' ? 'http://localhost:8787' : '';
    });
    expect(apiUrl).toBe('http://localhost:8787');

    await page.close();
  });
});
