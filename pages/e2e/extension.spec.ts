import { test, chromium, expect } from '@playwright/test';
import { paths, server } from '../config';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Chrome Extension', () => {
  test('extension functionality', async ({ page }, testInfo) => {
    // Launch browser with extension
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${paths.extension}`,
        `--load-extension=${paths.extension}`,
      ],
    });

    // Get extension ID
    let extensionId = 'unknown-extension-id';
    const tempPage = await context.newPage();
    try {
      await tempPage.goto('https://example.com');
      await tempPage.waitForTimeout(1000);
      const workers = await context.serviceWorkers();
      if (workers.length > 0 && workers[0].url()) {
        extensionId = workers[0].url().split('/')[2];
      }
    } finally {
      await tempPage.close();
    }

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
    expect(extensionId, 'Extension ID should be valid').not.toBe('unknown-extension-id');
    expect(extensionId, 'Extension ID should match expected format').toMatch(/^[a-z]{32}$/);
    
    // Wait for extension to be fully loaded
    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      const workers = await context.serviceWorkers();
      if (workers.length > 0 && workers[0].url().includes(extensionId)) {
        console.log('Extension service worker loaded successfully');
        break;
      }
      console.log('Waiting for extension service worker to load...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    if (retries === maxRetries) {
      throw new Error('Extension service worker failed to load after multiple retries');
    }

    const workers = await context.serviceWorkers();
    expect(workers.length).toBe(1);
    expect(workers[0].url()).toContain(extensionId);
    expect(workers[0].url()).toContain('background');

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

    // 4. Generate test history
    const testPages = [
      { url: 'https://example.com/page1', title: 'Test Page 1' },
      { url: 'https://example.com/page2', title: 'Test Page 2' },
      { url: 'https://example.com/duplicate', title: 'Duplicate Page' }
    ];

    // Visit test pages to generate history
    for (const page of testPages) {
      const testPage = await context.newPage();
      await testPage.goto(page.url);
      await testPage.waitForLoadState('networkidle');
      await testPage.close();
    }

    // Generate duplicate entries
    const duplicatePage = await context.newPage();
    for (let i = 0; i < 2; i++) {
      await duplicatePage.goto(testPages[2].url);
      await duplicatePage.waitForLoadState('networkidle');
    }
    await duplicatePage.close();

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

    // Verify initialization success
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
    const syncButton = await popupPage.waitForSelector('button:has-text("Sync with Server")', 
      { state: 'visible', timeout: 5000 });
    
    // Set up dialog listener before clicking
    const syncDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
    await syncButton.click();
    
    // Wait for and verify dialog
    const syncDialog = await syncDialogPromise;
    expect(['Sync completed successfully', 'Failed to sync with server']).toContain(syncDialog.message());
    await syncDialog.accept().catch(() => {
      // If dialog was already handled, ignore the error
      console.log('Sync dialog was already handled');
    });

    // Screenshot: After sync completion showing history entries
    await popupPage.screenshot({
      path: 'pages/test-results/03-after-sync-with-history.png',
      fullPage: true
    });

    // 9. Verify deduplication
    const duplicateEntries = await popupPage.locator(`.history-entry a[href="${testPages[2].url}"]`).all();
    expect(duplicateEntries.length).toBeGreaterThanOrEqual(1);

    // Verify timestamps are different
    const timestamps = await popupPage.evaluate((url) => {
      const entries = document.querySelectorAll(`.history-entry a[href="${url}"]`);
      return Array.from(entries).map(entry => 
        entry.nextElementSibling?.textContent
      );
    }, testPages[2].url);

    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(timestamps.length);

    // Screenshot: Final state showing deduplication results
    await popupPage.screenshot({
      path: 'pages/test-results/04-final-with-deduplication.png',
      fullPage: true
    });

    // Verify no errors occurred throughout the test
    expect(errors).toEqual([]);
    // Cleanup and handle failures
    try {
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
    } finally {
      // Close all pages and context
      await Promise.all(context.pages().map(p => p.close().catch(console.error)));
      await context.close().catch(console.error);
    }
  });
});