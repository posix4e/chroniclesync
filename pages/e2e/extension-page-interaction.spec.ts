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
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    const clientIdInput = await extensionPage.waitForSelector('#clientId');
    expect(clientIdInput).toBeTruthy();
  });

  test('client initialization works', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId');
    
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    
    // Verify initialization by checking if sync button appears
    const syncButton = await extensionPage.waitForSelector('text=Sync with Server');
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
    
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    // Initialize client first
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId');
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server');
    
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
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId');
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.waitForSelector('text=Sync with Server');
    
    // Click sync button and wait for success dialog
    const dialogPromise = extensionPage.waitForEvent('dialog');
    await extensionPage.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');
    expect(errors).toEqual([]);
  });

  test('history view shows synced browsing data', async ({ context, extensionId }) => {
    const extensionPage = await context.newPage();
    
    // Mock the API response
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('api-staging.chroniclesync.xyz/history')) {
        if (request.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                url: 'https://example.com',
                title: 'Example Domain',
                timestamp: Date.now() - 1000,
                deviceId: 'device1',
                deviceInfo: {
                  platform: 'Windows',
                  browser: 'Chrome',
                  version: '120.0.0'
                }
              },
              {
                url: 'https://test.com',
                title: 'Test Site',
                timestamp: Date.now(),
                deviceId: 'device2',
                deviceInfo: {
                  platform: 'MacOS',
                  browser: 'Chrome',
                  version: '120.0.0'
                }
              }
            ])
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'History saved' })
          });
        }
      } else {
        await route.continue();
      }
    });

    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.waitForLoadState('networkidle');

    // Switch to history tab
    await extensionPage.click('button:has-text("History")');
    await extensionPage.waitForTimeout(1000);

    // Verify history entries
    const historyItems = await extensionPage.locator('.history-item').count();
    expect(historyItems).toBe(2);

    // Verify device filtering
    const deviceSelect = await extensionPage.locator('select');
    await deviceSelect.selectOption({ index: 1 }); // First device
    await extensionPage.waitForTimeout(500);
    const filteredItems = await extensionPage.locator('.history-item').count();
    expect(filteredItems).toBe(1);
  });

  test('history syncs in real-time', async ({ context, extensionId }) => {
    const errors: string[] = [];
    const extensionPage = await context.newPage();
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Mock API responses
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('api-staging.chroniclesync.xyz/history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'History saved' })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to test pages
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.waitForTimeout(1000);

    // Open extension and check history
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.click('button:has-text("History")');
    await extensionPage.waitForTimeout(1000);

    // Verify no errors occurred
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