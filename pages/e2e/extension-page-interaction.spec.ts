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
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    const clientIdInput = await extensionPage.waitForSelector('#clientId', { state: 'visible' });
    expect(clientIdInput).toBeTruthy();
  });

  test('client initialization works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { state: 'visible' });
    
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    
    // Verify initialization by checking if sync button appears
    const syncButton = await extensionPage.waitForSelector('text=Sync with Server', { state: 'visible' });
    expect(syncButton).toBeTruthy();
  });

  test('sync with server works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    
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
    
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Initialize client first
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { state: 'visible' });
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server', { state: 'visible' });
    
    // Click sync button and wait for success dialog
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');
  });

  test('no console errors during operations', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    const errors: string[] = [];
    extensionPage.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_FILE_NOT_FOUND')) {
        errors.push(msg.text());
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

    // Perform all operations
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId', { state: 'visible' });
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server', { state: 'visible' });
    
    // Click sync button and wait for success dialog
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');
    expect(errors).toEqual([]);
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