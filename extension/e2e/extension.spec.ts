import { test, expect, getExtensionUrl } from './utils/extension';
import { server } from './test-config';

test.describe('ChronicleSync Extension', () => {
  // Set up dialog handler for all tests
  test.beforeEach(async ({ context }) => {
    context.on('page', page => {
      page.on('dialog', dialog => dialog.accept());
    });
  });

  test.describe('Basic Extension Tests', () => {
    test('extension should be loaded with correct ID', async ({ context, extensionId }) => {
      expect(extensionId).not.toBe('unknown-extension-id');
      expect(extensionId).toMatch(/^[a-z]{32}$/);
      console.log('Extension loaded with ID:', extensionId);

      const testPage = await context.newPage();
      await testPage.goto('https://example.com');
      await testPage.waitForTimeout(1000);

      const workers = await context.serviceWorkers();
      expect(workers.length).toBe(1);

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
        errors.push(error.error().message);
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });

    test('popup should load React app correctly', async ({ context, extensionId }) => {
      const popupPage = await context.newPage();
      await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));

      const rootElement = await popupPage.locator('#root');
      await expect(rootElement).toBeVisible();

      await popupPage.waitForLoadState('networkidle');
      await popupPage.waitForTimeout(1000);

      await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
      await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
      await expect(popupPage.locator('#adminLogin')).toBeVisible();

      const reactRoot = await popupPage.evaluate(() => {
        const root = document.getElementById('root');
        return root?.hasAttribute('data-reactroot') ||
               (root?.children.length ?? 0) > 0;
      });
      expect(reactRoot).toBeTruthy();

      const errors: string[] = [];
      popupPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      await popupPage.waitForTimeout(1000);
      expect(errors).toEqual([]);

      await popupPage.screenshot({
        path: 'test-results/extension-popup.png',
        fullPage: true
      });
    });
  });

  test.describe('Extension-Page Integration', () => {
    test('client initialization works', async ({ context, extensionId }) => {
      const extensionPage = await context.newPage();
      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      
      await extensionPage.waitForLoadState('networkidle');
      await extensionPage.waitForSelector('#clientId');
      
      await extensionPage.fill('#clientId', 'test-client');
      await extensionPage.click('text=Initialize');
      
      const syncButton = await extensionPage.waitForSelector('text=Sync with Server');
      expect(syncButton).toBeTruthy();
    });

    test('sync with server works', async ({ context, extensionId }) => {
      const extensionPage = await context.newPage();
      
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
      
      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      
      await extensionPage.waitForLoadState('networkidle');
      await extensionPage.waitForSelector('#clientId');
      await extensionPage.fill('#clientId', 'test-client');
      await extensionPage.click('text=Initialize');
      await extensionPage.waitForSelector('text=Sync with Server');
      
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

      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      await extensionPage.waitForLoadState('networkidle');
      await extensionPage.waitForSelector('#clientId');
      await extensionPage.fill('#clientId', 'test-client');
      await extensionPage.click('text=Initialize');
      await extensionPage.waitForSelector('text=Sync with Server');
      
      const dialogPromise = extensionPage.waitForEvent('dialog');
      await extensionPage.click('text=Sync with Server');
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('Sync successful');
      expect(errors).toEqual([]);
    });
  });

  test.describe('History Sync Feature', () => {
    test('should sync history and display in pages UI', async ({ context, extensionId }) => {
      // Create test pages and generate history
      const testPage = await context.newPage();
      await testPage.goto('https://example.com');
      await testPage.goto('https://test.com');

      // Open extension popup
      const popupPage = await context.newPage();
      await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));

      // Set client ID in settings
      await popupPage.click('text=Settings');
      await popupPage.fill('#clientId', 'test-client-id');
      await popupPage.click('text=Save Settings');

      // Verify success message
      const message = await popupPage.textContent('.message');
      expect(message).toContain('Settings saved successfully');

      // Navigate to pages UI and verify history
      const pagesUrl = await popupPage.getAttribute('#pagesUrl', 'value');
      expect(pagesUrl).toBeTruthy();
      await testPage.goto(pagesUrl!);

      await testPage.screenshot({ path: 'test-results/history-view.png' });

      const historyEntries = await testPage.$$('.history-entry');
      expect(historyEntries.length).toBeGreaterThan(0);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    }
  });
});