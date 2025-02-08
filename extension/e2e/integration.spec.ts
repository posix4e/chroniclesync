import { test, expect, getExtensionUrl } from './utils/extension';
import { server } from './test-config';

test.describe('ChronicleSync E2E Tests', () => {
  // Set up dialog handler for all tests
  test.beforeEach(async ({ context }) => {
    context.on('page', page => {
      page.on('dialog', dialog => dialog.accept());
    });
  });

  test.describe('Extension Setup', () => {
    test('extension should be loaded with correct ID', async ({ context, extensionId }) => {
      // Verify we got a valid extension ID
      expect(extensionId).not.toBe('unknown-extension-id');
      expect(extensionId).toMatch(/^[a-z]{32}$/);
      console.log('Extension loaded with ID:', extensionId);

      // Open a new page to trigger the background script
      const testPage = await context.newPage();
      await testPage.goto('https://example.com');
      await testPage.waitForTimeout(1000);

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
      // Check for any console errors
      const errors: string[] = [];
      context.on('weberror', error => {
        errors.push(error.error().message);
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait a bit to catch any immediate errors
      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });
  });

  test.describe('UI and Interaction', () => {
    test('popup should load React app correctly', async ({ context, extensionId }) => {
      // Open extension popup directly from extension directory
      const popupPage = await context.newPage();
      await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));

      // Wait for the root element to be visible
      const rootElement = await popupPage.locator('#root');
      await expect(rootElement).toBeVisible();

      // Wait for React to mount and render content
      await popupPage.waitForLoadState('networkidle');
      await popupPage.waitForTimeout(1000); // Give React a moment to hydrate

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
          errors.push(msg.text());
        }
      });
      await popupPage.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });

    test('client initialization works', async ({ context, extensionId }) => {
      const extensionPage = await context.newPage();
      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      
      await extensionPage.waitForLoadState('networkidle');
      await extensionPage.waitForSelector('#clientId');
      
      await extensionPage.fill('#clientId', 'test-client');
      await extensionPage.click('text=Initialize');
      
      // Verify initialization by checking if sync button appears
      const syncButton = await extensionPage.waitForSelector('text=Sync with Server');
      expect(syncButton).toBeTruthy();
    });
  });

  test.describe('History Sync', () => {
    test('history recording works', async ({ context }) => {
      // Create a new page for history recording
      const page = await context.newPage();

      // Visit test pages and record history
      await page.goto('https://example.com');
      await page.waitForTimeout(1000); // Wait for history to be recorded

      await page.goto('https://example.org');
      await page.waitForTimeout(1000);

      interface HistoryItem {
        id: string;
        url: string;
        title: string;
        lastVisitTime: number;
        visitCount: number;
      }

      // Verify history entries were created
      const history = await page.evaluate(() => {
        return new Promise<HistoryItem[]>((resolve) => {
          chrome.history.search({ text: '', maxResults: 10 }, (results) => {
            resolve(results);
          });
        });
      });

      expect(history).toBeTruthy();
      expect(Array.isArray(history)).toBeTruthy();
      expect(history.length).toBeGreaterThan(0);
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
      
      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      
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

    test('no errors during sync operations', async ({ context, extensionId }) => {
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
      await extensionPage.goto(getExtensionUrl(extensionId, 'popup.html'));
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