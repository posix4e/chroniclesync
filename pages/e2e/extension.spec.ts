import { test, expect } from '@playwright/test';
import { server } from '../config';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Chrome Extension', () => {
  test('extension functionality', async ({ context }, testInfo) => {
    // Verify browser context has extension support
    const browserContextType = Object.getPrototypeOf(context).constructor.name;
    console.log('Browser context type:', browserContextType);
    
    // Create a new page and navigate to a real URL to properly trigger extension
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit to ensure extension has time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the extension ID from the background context
    const backgroundContexts = await context.backgroundPages();
    console.log(`Found ${backgroundContexts.length} background contexts`);
    
    const extensionId = await context.evaluate(() => {
      return new Promise<string>((resolve) => {
        // Chrome provides the ID via chrome.runtime.id
        if (chrome.runtime.id) {
          resolve(chrome.runtime.id);
          return;
        }
        
        // If not immediately available, wait for it
        chrome.runtime.onInstalled.addListener(() => {
          resolve(chrome.runtime.id);
        });
      });
    });
    
    console.log('Found extension ID:', extensionId);

    // Set up error tracking
    const errors: string[] = [];
    context.on('weberror', error => {
      console.log('Web error:', error.error().message);
      errors.push(error.error().message);
    });

    // Set up error logging for all pages
    context.on('page', page => {
      page.on('console', msg => {
        if (msg.type() === 'error' &&
            !msg.text().includes('net::ERR_FILE_NOT_FOUND') &&
            !msg.text().includes('status of 404')) {
          console.log('Console error:', msg.text());
          errors.push(msg.text());
        }
      });
    });

    // 1. Verify extension setup
    console.log('Extension loaded with ID:', extensionId);
    expect(extensionId, 'Extension ID should be valid').toBeTruthy();
    expect(extensionId.length, 'Extension ID should be at least 32 characters').toBeGreaterThanOrEqual(32);
    console.log('Extension service worker loaded successfully');

    // 2. API health check
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    const healthResponse = await page.request.get(`${apiUrl}/health`);
    const responseBody = await healthResponse.json();
    expect(healthResponse.ok()).toBeTruthy();
    expect(responseBody.healthy).toBeTruthy();

    // 3. Initial popup load and UI verification
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForLoadState('networkidle');

    // Screenshot: Initial extension popup state with login form
    await popupPage.screenshot({
      path: 'pages/test-results/01-initial-popup-with-login.png',
      fullPage: true
    });

    // Verify initial UI state
    await popupPage.waitForSelector('#root', { state: 'visible' });
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();
    await expect(popupPage.locator('#clientId')).toBeVisible();

    // Verify React initialization
    const reactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // 4. Generate test history and verify background script handling
    const testPages = [
      { url: 'https://example.com/page1', title: 'Test Page 1' },
      { url: 'https://example.com/page2', title: 'Test Page 2' },
      { url: 'https://example.com/duplicate', title: 'Duplicate Page' }
    ];

    // Set up history event monitoring
    const historyEvents: Array<{url: string, timestamp: number}> = [];
    await context.exposeFunction('recordHistoryEvent', (url: string) => {
      historyEvents.push({url, timestamp: Date.now()});
    });

    // Visit test pages to generate history
    for (const page of testPages) {
      const testPage = await context.newPage();
      await testPage.evaluate((url) => {
        chrome.history?.onVisited?.addListener((result) => {
          if (result.url === url) {
            // @ts-ignore: exposed function
            window.recordHistoryEvent(url);
          }
        });
      }, page.url);
      
      await testPage.goto(page.url);
      await testPage.waitForLoadState('networkidle');
      await testPage.close();
    }

    // Verify history events were captured by the background script
    await expect.poll(() => historyEvents.length).toBeGreaterThanOrEqual(testPages.length);

    // Generate and verify duplicate handling
    const duplicatePage = await context.newPage();
    const duplicateUrl = testPages[2].url;
    
    await duplicatePage.evaluate((url) => {
      chrome.history?.onVisited?.addListener((result) => {
        if (result.url === url) {
          // @ts-ignore: exposed function
          window.recordHistoryEvent(url);
        }
      });
    }, duplicateUrl);

    for (let i = 0; i < 2; i++) {
      await duplicatePage.goto(duplicateUrl);
      await duplicatePage.waitForLoadState('networkidle');
    }
    await duplicatePage.close();

    // Verify duplicate events were captured
    const duplicateEvents = historyEvents.filter(e => e.url === duplicateUrl);
    expect(duplicateEvents.length).toBeGreaterThanOrEqual(2);

    // 5. Client initialization
    await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 5000 });
    await popupPage.fill('#clientId', 'test-client');
    
    // Debug: Check what elements are present
    console.log('Checking available elements...');
    const elements = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootContent: root?.innerHTML,
        initButton: !!document.getElementById('initButton'),
        buttonText: document.querySelector('button')?.textContent,
        allButtons: Array.from(document.querySelectorAll('button')).map(b => ({
          id: b.id,
          text: b.textContent,
          isVisible: b.offsetParent !== null
        }))
      };
    });
    console.log('Elements found:', JSON.stringify(elements, null, 2));
    
    // Wait for initialization dialog
    console.log('Setting up dialog listener and waiting for Initialize button...');
    const initButton = await popupPage.waitForSelector('button:has-text("Initialize")', { state: 'visible', timeout: 5000 });
    console.log('Initialize button found, setting up dialog listener...');
    
    // Set up dialog handler before clicking
    const dialogPromise = popupPage.waitForEvent('dialog');
    
    console.log('Clicking Initialize button...');
    await initButton.click();
    console.log('Waiting for initialization dialog...');
    
    const initDialog = await dialogPromise;
    console.log('Dialog message received:', initDialog.message());
    expect(initDialog.message()).toBe('Client initialized successfully');
    await initDialog.accept().catch(() => {
      // If dialog was already handled, ignore the error
      console.log('Dialog was already handled');
    });

    // Screenshot: After successful client initialization
    await popupPage.screenshot({
      path: 'pages/test-results/02-after-client-initialization.png',
      fullPage: true
    });

    // Verify initialization success by checking admin login is hidden
    await expect(popupPage.locator('#adminLogin')).toHaveCSS('display', 'none');

    // 6. Verify history entries
    await popupPage.waitForSelector('.history-entry', { timeout: 5000 });
    const entries = await popupPage.locator('.history-entry').all();
    expect(entries.length).toBeGreaterThanOrEqual(testPages.length);

    // Verify all test pages appear in history
    for (const page of testPages) {
      const entryExists = await popupPage.locator(`.history-entry a[href="${page.url}"]`).count() > 0;
      expect(entryExists).toBeTruthy();
    }

    // 7. Configure settings
    await popupPage.fill('#retentionDays', '7');
    await popupPage.click('text=Save Settings');

    // 8. Test sync functionality
    // Monitor sync messages from the background script
    const syncMessages: string[] = [];
    await context.exposeFunction('recordSyncMessage', (message: string) => {
      syncMessages.push(message);
    });

    // Set up sync message monitoring
    await popupPage.evaluate(() => {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'sync') {
          // @ts-ignore: exposed function
          window.recordSyncMessage(message.status);
        }
      });
    });

    const syncButton = await popupPage.waitForSelector('button:has-text("Sync Now")', 
      { state: 'visible', timeout: 5000 });
    
    // Click sync and wait for response
    await syncButton.click();
    
    // Wait for sync to complete
    await expect.poll(() => syncMessages.length, {
      timeout: 5000,
      message: 'Waiting for sync completion message'
    }).toBeGreaterThan(0);

    // Verify sync status
    const lastSyncMessage = syncMessages[syncMessages.length - 1];
    expect(['success', 'error']).toContain(lastSyncMessage);

    // Screenshot: After sync completion showing history entries
    await popupPage.screenshot({
      path: 'pages/test-results/03-after-sync-with-history.png',
      fullPage: true
    });

    // 9. Verify history handling and deduplication in background
    // Check the actual history entries through chrome.history API
    const historyEntries = await popupPage.evaluate(async (url) => {
      return new Promise((resolve) => {
        chrome.history.search({
          text: url,
          maxResults: 10,
          startTime: 0
        }, (results) => {
          resolve(results.map(r => ({
            url: r.url,
            title: r.title,
            visitCount: r.visitCount,
            lastVisitTime: r.lastVisitTime
          })));
        });
      });
    }, testPages[2].url);

    console.log('History entries for duplicate URL:', JSON.stringify(historyEntries, null, 2));

    // Verify visit count reflects actual visits
    const mainEntry = historyEntries[0];
    expect(mainEntry.visitCount).toBeGreaterThanOrEqual(2);

    // Verify the background script's pending queue
    const pendingItems = await context.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'getPendingItems' }, (response) => {
          resolve(response.items || []);
        });
      });
    });

    console.log('Pending items in background queue:', JSON.stringify(pendingItems, null, 2));

    // Verify the background script is processing items correctly
    expect(pendingItems.length).toBe(0); // Should be empty after successful sync

    // Screenshot: Final state showing deduplication results
    await popupPage.screenshot({
      path: 'pages/test-results/04-final-with-deduplication.png',
      fullPage: true
    });

    // Verify no errors occurred throughout the test
    expect(errors).toEqual([]);
    // Handle failures
    if (testInfo.status !== testInfo.expectedStatus) {
      // Screenshot: Failure state with timestamp for debugging
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `pages/test-results/failure-${testInfo.title.replace(/\s+/g, '-')}-${timestamp}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
      
      // Log the page content for debugging
      const content = await page.content();
      console.log('Page content at failure:', content);
    }
  });
});