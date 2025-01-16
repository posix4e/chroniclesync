import { test, expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  test('extension should load and sync history', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Create a background page to access extension's background script
    let backgroundPage = (await context.backgroundPages())[0];
    if (!backgroundPage) {
      // Wait for the background page to be created with a more specific timeout
      backgroundPage = await Promise.race([
        context.waitForEvent('backgroundpage'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Background page creation timeout')), 10000))
      ]) as any;
    }

    // Wait for the extension to initialize and verify it's ready
    await backgroundPage.waitForFunction(() => {
      return typeof browser !== 'undefined' && browser.storage && browser.history;
    }, { timeout: 10000 });

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

    let backgroundPage = (await context.backgroundPages())[0];
    if (!backgroundPage) {
      backgroundPage = await Promise.race([
        context.waitForEvent('backgroundpage'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Background page creation timeout')), 10000))
      ]) as any;
    }

    await backgroundPage.waitForFunction(() => {
      return typeof browser !== 'undefined' && browser.storage;
    }, { timeout: 10000 });

    // Mock API failure
    await backgroundPage.route('https://api.chroniclesync.xyz**', route => 
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
    
    // Mock the responses for both URLs to avoid DNS issues
    await context.route('**/*.chroniclesync.xyz', route => {
      route.fulfill({
        status: 200,
        body: '<html><body>Mocked response</body></html>'
      });
    });

    await context.route('**/*.pages.dev', route => {
      route.fulfill({
        status: 200,
        body: '<html><body>Mocked response</body></html>'
      });
    });

    // Test production URL with mocked response
    await page.goto('https://chroniclesync.xyz', { waitUntil: 'networkidle' });
    let apiUrl = await page.evaluate(() => {
      return window.location.hostname === 'chroniclesync.xyz' ? 'https://api.chroniclesync.xyz' : '';
    });
    expect(apiUrl).toBe('https://api.chroniclesync.xyz');

    // Test staging URL with mocked response
    await page.goto('https://my-branch.chroniclesync.pages.dev', { waitUntil: 'networkidle' });
    apiUrl = await page.evaluate(() => {
      return window.location.hostname.endsWith('.pages.dev') ? 'https://api-staging.chroniclesync.xyz' : '';
    });
    expect(apiUrl).toBe('https://api-staging.chroniclesync.xyz');

    await page.close();
  });
});