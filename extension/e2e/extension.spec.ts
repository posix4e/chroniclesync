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
        if (request.url().includes('api-staging.chroniclesync.xyz') && request.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
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
        if (request.url().includes('api-staging.chroniclesync.xyz') && request.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
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
      console.log('Starting history sync test...');
      
      // Create test pages and generate history
      console.log('Creating test page...');
      const testPage = await context.newPage();

      // Mock API endpoints
      await testPage.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, token: 'mock-token' })
        });
      });

      await testPage.route('**/api/history', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { url: 'https://example.com', title: 'Example Domain', timestamp: new Date().toISOString() },
              { url: 'https://www.mozilla.org', title: 'Mozilla', timestamp: new Date().toISOString() }
            ]
          })
        });
      });
      
      // Mock browser history API
      await testPage.addInitScript(() => {
        const mockHistory = [
          { url: 'https://example.com', title: 'Example Domain', lastVisitTime: Date.now() },
          { url: 'https://www.mozilla.org', title: 'Mozilla', lastVisitTime: Date.now() }
        ];

        // @ts-expect-error Chrome API mock
        chrome.history = {
          search: (_params) => {
            return Promise.resolve(mockHistory.map(entry => ({
              ...entry,
              id: Math.random().toString(),
              typedCount: 1,
              visitCount: 1
            })));
          }
        };
      });
      
      // Open extension popup
      console.log('Opening extension popup...');
      const popupPage = await context.newPage();
      await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'), { timeout: 30000 });
      
      // Wait for the popup to fully load
      console.log('Waiting for popup to load...');
      await popupPage.waitForLoadState('networkidle', { timeout: 30000 });
      await popupPage.waitForLoadState('domcontentloaded', { timeout: 30000 });

      // Debug: Take screenshot and log content
      console.log('Taking initial screenshot...');
      await popupPage.screenshot({ path: 'test-results/popup-initial.png' });
      console.log('Initial popup content:', await popupPage.content());

      // Initialize client first (this is needed before settings)
      console.log('Looking for client ID input...');
      await popupPage.waitForSelector('#clientId', { timeout: 30000 });
      
      console.log('Filling client ID...');
      await popupPage.fill('#clientId', 'test-client-id');
      
      console.log('Clicking Initialize...');
      await popupPage.click('text=Initialize');
      
      console.log('Waiting for Sync button...');
      await popupPage.waitForSelector('text=Sync with Server', { timeout: 30000 });

      // Try different selectors for settings
      try {
        console.log('Waiting for animations...');
        await popupPage.waitForTimeout(1000);
        
        // Take screenshot before looking for settings
        console.log('Taking pre-settings screenshot...');
        await popupPage.screenshot({ path: 'test-results/pre-settings.png' });
        
        console.log('Current page content:', await popupPage.content());
        
        // Try different possible selectors for the settings button
        const settingsSelectors = [
          'text=Settings',
          'button:has-text("Settings")',
          '[data-testid="settings-button"]',
          '#settings-button',
          '.settings-button',
          'a:has-text("Settings")',
          '[aria-label="Settings"]',
          // Add more specific selectors based on the actual UI
          'button >> text=Settings',
          '.nav-link:has-text("Settings")',
          '[role="button"]:has-text("Settings")'
        ];

        console.log('Trying to find settings button...');
        let settingsElement = null;
        for (const selector of settingsSelectors) {
          console.log('Trying selector:', selector);
          const element = await popupPage.$(selector);
          if (element) {
            settingsElement = element;
            console.log('Found settings button with selector:', selector);
            break;
          }
        }

        if (settingsElement) {
          console.log('Clicking settings button...');
          await settingsElement.click();
        } else {
          console.log('Could not find settings button. Page content:', await popupPage.content());
          throw new Error('Could not find settings button with any known selector');
        }

        // Wait for settings form
        console.log('Waiting for settings form...');
        await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 30000 });
        
        console.log('Filling client ID in settings...');
        await popupPage.fill('#clientId', 'test-client-id');
        
        // Try different selectors for save button
        console.log('Looking for save button...');
        const saveSelectors = [
          'text=Save Settings',
          'button:has-text("Save")',
          '[type="submit"]',
          '#save-settings',
          '.save-button',
          // Add more specific selectors
          'button >> text=Save',
          '[role="button"]:has-text("Save")',
          'input[type="submit"]'
        ];

        let saveButton = null;
        for (const selector of saveSelectors) {
          console.log('Trying save button selector:', selector);
          const element = await popupPage.$(selector);
          if (element) {
            saveButton = element;
            console.log('Found save button with selector:', selector);
            break;
          }
        }
        
        if (saveButton) {
          console.log('Clicking save button...');
          await saveButton.click();
        } else {
          console.log('Could not find save button. Page content:', await popupPage.content());
          throw new Error('Could not find save button with any known selector');
        }

        // Wait for success message with more flexibility
        console.log('Waiting for success message...');
        const messageSelectors = [
          '.message',
          '.success-message',
          '[role="alert"]',
          '.notification',
          // Add more specific selectors
          '[data-testid="success-message"]',
          '.toast-success',
          '.alert-success'
        ].join(',');

        const messageElement = await popupPage.waitForSelector(messageSelectors, { 
          timeout: 30000,
          state: 'visible'
        });
        
        const message = await messageElement.textContent();
        console.log('Success message:', message);
        expect(message?.toLowerCase()).toContain('success');

      } catch (error) {
        console.log('Error in settings flow:', error);
        // Take screenshot on error for debugging
        await popupPage.screenshot({ path: 'test-results/settings-error.png' });
        throw error;
      }

      // Navigate to pages UI and verify history
      console.log('Getting pages URL...');
      const pagesUrl = server.pagesUrl;
      console.log('Pages URL:', pagesUrl);
      expect(pagesUrl).toBeTruthy();
      
      console.log('Navigating to pages UI...');
      await testPage.goto(pagesUrl, { timeout: 30000 });
      await testPage.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Take screenshot of history view
      console.log('Taking history view screenshot...');
      await testPage.screenshot({ path: 'test-results/history-view.png' });

      // Log the page content for debugging
      console.log('History page content:', await testPage.content());

      // Wait for history entries with more flexibility
      // Initialize client
      console.log('Initializing client...');
      await testPage.fill('#clientId', 'test-client-id');
      await testPage.click('text=Initialize');
      await testPage.waitForTimeout(1000);

      // Log in as admin
      console.log('Logging in as admin...');
      await testPage.fill('input[type="password"]', 'admin');
      await testPage.click('text=Login');
      await testPage.waitForTimeout(1000);

      // Wait for admin panel to appear
      await testPage.waitForSelector('#adminPanel', { timeout: 30000, state: 'visible' });

      // Click the Sync with Server button in the extension popup
      console.log('Opening extension popup for sync...');
      const syncPopupPage = await context.newPage();
      await syncPopupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
      await syncPopupPage.waitForLoadState('networkidle');

      // Initialize the client
      await syncPopupPage.fill('#clientId', 'test-client-id');
      await syncPopupPage.click('text=Initialize');
      await syncPopupPage.waitForSelector('text=Sync with Server');

      // Click Sync with Server
      console.log('Clicking Sync with Server button...');
      await syncPopupPage.click('text=Sync with Server');
      await syncPopupPage.waitForTimeout(1000);

      // Close the popup
      await syncPopupPage.close();

      // Reload the page to see the synced history
      console.log('Reloading page to see synced history...');
      await testPage.reload();
      await testPage.waitForLoadState('networkidle');

      // Initialize client and login again after reload
      console.log('Initializing client after reload...');
      await testPage.fill('#clientId', 'test-client-id');
      await testPage.click('text=Initialize');
      await testPage.waitForTimeout(1000);

      console.log('Logging in as admin after reload...');
      await testPage.fill('input[type="password"]', 'admin');
      await testPage.click('text=Login');
      await testPage.waitForTimeout(1000);

      // Wait for admin panel to appear
      console.log('Waiting for admin panel...');
      await testPage.waitForSelector('#adminPanel', { timeout: 30000, state: 'attached' });

      // Wait for stats table to appear
      console.log('Waiting for stats table...');
      await testPage.waitForSelector('#statsTable', { timeout: 30000, state: 'attached' });

      // Log the page content to see what's available
      console.log('Page content after admin panel appears:', await testPage.content());

      // Wait for client data to be loaded
      console.log('Waiting for client data...');
      const clientRows = await testPage.$$('#statsTable tbody tr');
      console.log('Found client rows:', clientRows.length);
      expect(clientRows.length).toBeGreaterThan(0);

      // Log any console messages
      testPage.on('console', msg => {
        console.log(`Browser console: ${msg.type()}: ${msg.text()}`);
      });
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