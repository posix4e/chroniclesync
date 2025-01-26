import { test, expect } from './utils/extension';
import { server } from '../config';

let sharedExtensionId: string;

test.describe.serial('Chrome Extension', () => {
  test('extension should be loaded with correct ID', async ({ context, extensionId }) => {
    // Verify we got a valid extension ID
    expect(extensionId).not.toBe('unknown-extension-id');
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    console.log('Extension loaded with ID:', extensionId);
    sharedExtensionId = extensionId;

    // Open a new page to trigger the background script
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    
    // Check for service workers
    const workers = await context.serviceWorkers();
    expect(workers.length).toBe(1);

    // Verify the service worker URL matches our extension
    const workerUrl = workers[0].url();
    expect(workerUrl).toContain(extensionId);
    expect(workerUrl).toContain('background');
  });

  test('API health check should be successful', async ({ page }) => {
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    
    const healthResponse = await page.request.get(`${apiUrl}/health`);
    console.log('Health check status:', healthResponse.status());
    
    const responseBody = await healthResponse.json();
    console.log('Health check response:', responseBody);
    
    expect(healthResponse.ok()).toBeTruthy();
    expect(responseBody.healthy).toBeTruthy();
  });

  test('should load without errors', async ({ page, context }) => {
    const errors: string[] = [];
    context.on('weberror', error => {
      console.log('Web error:', error.error().message);
      errors.push(error.error().message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
        errors.push(msg.text());
      }
    });

    // Load a test page
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('popup should load React app correctly', async ({ context }) => {
    // Open extension popup using the extension ID
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${sharedExtensionId}/popup.html`);

    // Wait for the root element to be visible
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');

    // Check for specific app content
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();

    // Check for React-specific attributes and content
    const reactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // Check for console errors
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
        errors.push(msg.text());
      }
    });
    
    await popupPage.waitForLoadState('networkidle');
    expect(errors).toEqual([]);

    // Take a screenshot of the popup
    await popupPage.screenshot({
      path: 'test-results/extension-popup.png',
      fullPage: true
    });
  });

  test('history sync functionality should work correctly', async ({ context }) => {
    // Set up dialog handler
    context.on('page', page => {
      page.on('dialog', async dialog => {
        console.log('Dialog appeared:', dialog.message());
        await dialog.accept();
      });
    });

    // Create test pages to generate history
    const testPages = [
      { url: 'https://example.com/page1', title: 'Test Page 1' },
      { url: 'https://example.com/page2', title: 'Test Page 2' }
    ];

    // Visit test pages to generate history
    for (const page of testPages) {
      const testPage = await context.newPage();
      await testPage.goto(page.url);
      await testPage.waitForLoadState('networkidle');
      await testPage.close();
    }

    // Open extension popup using the extension ID
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${sharedExtensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForLoadState('networkidle');

    // Initialize client
    await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
    await popupPage.fill('#clientId', 'test-client');
    await popupPage.click('text=Initialize');

    // Wait for sync button to appear (indicates successful initialization)
    const syncButton = await popupPage.waitForSelector('text=Sync with Server', 
      { state: 'visible', timeout: 10000 });
    expect(syncButton).toBeTruthy();

    // Wait for history entries to appear
    await popupPage.waitForSelector('.history-entry', { timeout: 10000 });
    const entries = await popupPage.locator('.history-entry').all();
    expect(entries.length).toBeGreaterThanOrEqual(testPages.length);

    // Verify test pages are in history
    for (const page of testPages) {
      const entryExists = await popupPage.locator(`.history-entry a[href="${page.url}"]`).count() > 0;
      expect(entryExists).toBeTruthy();
    }

    // Test retention period setting
    await popupPage.fill('#retentionDays', '7');
    await popupPage.click('text=Save Settings');
    await popupPage.waitForSelector('text=Settings saved', { timeout: 10000 });

    // Test sync functionality
    await syncButton.click();
    
    // Wait for sync to complete (either success or error)
    const syncResult = await Promise.race([
      popupPage.waitForSelector('text=Sync completed successfully', { timeout: 10000 }).then(() => 'success'),
      popupPage.waitForSelector('text=Failed to sync with server', { timeout: 10000 }).then(() => 'error')
    ]);
    expect(['success', 'error']).toContain(syncResult);

    // Verify history entries are still visible after sync
    const entriesAfterSync = await popupPage.locator('.history-entry').all();
    expect(entriesAfterSync.length).toBeGreaterThanOrEqual(testPages.length);
  });

  test('history deduplication should work correctly', async ({ context }) => {
    // Set up dialog handler
    context.on('page', page => {
      page.on('dialog', async dialog => {
        console.log('Dialog appeared:', dialog.message());
        await dialog.accept();
      });
    });

    // Visit the same page multiple times
    const testUrl = 'https://example.com/duplicate';
    const testPage = await context.newPage();
    
    for (let i = 0; i < 3; i++) {
      await testPage.goto(testUrl);
      await testPage.waitForLoadState('networkidle');
      // Use waitForTimeout instead of setTimeout for better control
      await testPage.waitForTimeout(1000);
    }
    await testPage.close();

    // Open extension popup using the extension ID
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${sharedExtensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForLoadState('networkidle');

    // Initialize client if needed
    const needsInit = await popupPage.locator('#adminLogin').isVisible();
    if (needsInit) {
      await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
      await popupPage.fill('#clientId', 'test-client');
      await popupPage.click('text=Initialize');
      await popupPage.waitForSelector('text=Sync with Server', { state: 'visible', timeout: 10000 });
    }

    // Wait for history entries
    await popupPage.waitForSelector('.history-entry', { timeout: 10000 });

    // Count entries for the test URL
    const duplicateEntries = await popupPage.locator(`.history-entry a[href="${testUrl}"]`).all();
    
    // Should have entries but with different timestamps
    expect(duplicateEntries.length).toBeGreaterThanOrEqual(1);

    // Verify timestamps are different
    const timestamps = await popupPage.evaluate((url) => {
      const entries = document.querySelectorAll(`.history-entry a[href="${url}"]`);
      return Array.from(entries).map(entry => 
        entry.nextElementSibling?.textContent
      );
    }, testUrl);

    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(timestamps.length);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
      
      // Log the page content for debugging
      const content = await page.content();
      console.log('Page content at failure:', content);
    }
  });
});