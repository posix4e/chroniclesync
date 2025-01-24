import { test, expect } from './utils/extension';
import { server } from '../config';

test.describe('Extension-Page Integration', () => {
  // Set up dialog handler for all tests
  test.beforeEach(async ({ context }) => {
    context.on('page', page => {
      page.on('dialog', dialog => dialog.accept());
    });
  });

  test('extension popup loads correctly', async ({ context, extensionId }) => {
    // Create a new page for the extension popup
    const extensionPage = await context.newPage();
    
    // Add error logging
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page error: ${msg.text()}`);
      }
    });
    
    // Add page error handling
    extensionPage.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });

    // Navigate to the extension popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await extensionPage.goto(popupUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Wait for the page to be ready
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    
    // Wait for and verify the root element
    const root = await extensionPage.waitForSelector('#root', { timeout: 10000 });
    expect(root).toBeTruthy();
    
    // Take a screenshot for debugging
    await extensionPage.screenshot({ path: 'test-results/popup-loaded.png' });
  });

  test('client initialization works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    
    // Add error logging
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page error: ${msg.text()}`);
      }
    });

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await extensionPage.goto(popupUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { timeout: 10000 });
    
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    
    // Verify initialization by checking if sync button appears
    const syncButton = await extensionPage.waitForSelector('text=Sync with Server', { timeout: 10000 });
    expect(syncButton).toBeTruthy();
    
    // Take a screenshot for debugging
    await extensionPage.screenshot({ path: 'test-results/client-initialized.png' });
  });

  test('sync with server works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    
    // Add error logging
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page error: ${msg.text()}`);
      }
    });
    
    // Mock the API response
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('api.chroniclesync.xyz') && request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Sync successful' })
        });
      } else {
        await route.continue();
      }
    });
    
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await extensionPage.goto(popupUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Initialize client first
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { timeout: 10000 });
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server', { timeout: 10000 });
    
    // Click sync button and wait for success dialog
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');
    
    // Take a screenshot for debugging
    await extensionPage.screenshot({ path: 'test-results/sync-successful.png' });
  });

  test('no console errors during operations', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    const errors: string[] = [];
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error(`Page error: ${msg.text()}`);
      }
    });

    // Mock the API response
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('api.chroniclesync.xyz') && request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Sync successful' })
        });
      } else {
        await route.continue();
      }
    });

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await extensionPage.goto(popupUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Perform all operations
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { timeout: 10000 });
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server', { timeout: 10000 });
    
    // Click sync button and wait for success dialog
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');
    expect(errors).toEqual([]);
    
    // Take a screenshot for debugging
    await extensionPage.screenshot({ path: 'test-results/no-errors.png' });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Capture a screenshot after each test if it fails
    if (testInfo.status !== testInfo.expectedStatus) {
      // Create a unique name for the failure screenshot
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    }
  });
});