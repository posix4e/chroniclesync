import { test, expect } from './utils/extension';
import { server } from '../config';

test.describe('Extension-Page Integration', () => {
  // Set up dialog handler for all tests
  test.beforeEach(async ({ context }) => {
    // Handle dialogs automatically
    context.on('page', page => {
      page.on('dialog', async dialog => {
        console.log('Dialog appeared:', dialog.message());
        await dialog.accept();
      });
    });
  });

  test('extension popup loads correctly', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for the page to be fully loaded
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    
    // Wait for React to mount
    await extensionPage.waitForSelector('#root', { state: 'visible' });
    await extensionPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
    expect(await extensionPage.isVisible('#clientId')).toBeTruthy();
  });

  test('client initialization works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for the page to be ready
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#root', { state: 'visible' });
    
    // Wait for and interact with the client ID input
    const clientIdInput = await extensionPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
    expect(clientIdInput).toBeTruthy();
    
    // Fill and submit
    await extensionPage.fill('#clientId', 'test-client');
    
    // Set up dialog listener before clicking
    const dialogPromise = extensionPage.waitForEvent('dialog', { timeout: 10000 });
    await extensionPage.click('text=Initialize');
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Client initialized successfully');
    await dialog.accept();
    
    // Verify initialization by checking if admin login is hidden
    await expect(extensionPage.locator('#adminLogin')).toHaveCSS('display', 'none');
  });

  test('sync with server works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    
    // Set up API response mock before navigation
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('/sync') && request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });
    
    // Navigate and wait for page load
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    
    // Initialize client
    await extensionPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
    await extensionPage.fill('#clientId', 'test-client');
    
    // Wait for initialization dialog
    const initDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 10000 });
    await extensionPage.click('text=Initialize');
    const initDialog = await initDialogPromise;
    expect(initDialog.message()).toBe('Client initialized successfully');
    await initDialog.accept();
    
    // Wait for sync button and click
    const syncButton = await extensionPage.waitForSelector('button:has-text("Sync with Server")', 
      { state: 'visible', timeout: 10000 });
    
    // Set up dialog listener before clicking
    const syncDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 10000 });
    await syncButton.click();
    
    // Wait for and verify dialog
    const syncDialog = await syncDialogPromise;
    expect(syncDialog.message()).toBe('Sync completed successfully');
    await syncDialog.accept();
  });

  test('no console errors during operations', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    const errors: string[] = [];
    
    // Set up error logging
    extensionPage.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_FILE_NOT_FOUND')) {
        console.log('Console error:', msg.text());
        errors.push(msg.text());
      }
    });

    // Set up API mock
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('/sync') && request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate and wait for load
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    
    // Initialize and sync
    await extensionPage.waitForSelector('#clientId', { state: 'visible', timeout: 10000 });
    await extensionPage.fill('#clientId', 'test-client');
    
    // Wait for initialization dialog
    const initDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 10000 });
    await extensionPage.click('text=Initialize');
    const initDialog = await initDialogPromise;
    expect(initDialog.message()).toBe('Client initialized successfully');
    await initDialog.accept();
    
    // Wait for sync button and click
    const syncButton = await extensionPage.waitForSelector('button:has-text("Sync with Server")', 
      { state: 'visible', timeout: 10000 });
    
    // Set up dialog listener before clicking
    const syncDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 10000 });
    await syncButton.click();
    
    // Wait for and verify dialog
    const syncDialog = await syncDialogPromise;
    expect(syncDialog.message()).toBe('Sync completed successfully');
    await syncDialog.accept();
    
    expect(errors).toEqual([]);
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