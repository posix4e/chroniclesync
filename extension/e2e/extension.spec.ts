import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('Chrome Extension', () => {
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

  test.skip('API health check should be successful', async () => {
    // Skip this test until we have a proper API server
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

    // Take a screenshot of the popup
    await popupPage.screenshot({
      path: 'test-results/extension-popup.png',
      fullPage: true
    });
  });

  test('settings should open and save correctly', async ({ context, extensionId }) => {
    // Open settings page directly
    const settingsPage = await context.newPage();
    const errors: string[] = [];
    settingsPage.on('console', msg => {
      console.log('Console message:', msg.type(), msg.text());
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    const settingsUrl = getExtensionUrl(extensionId, 'settings.html');
    await settingsPage.goto(settingsUrl);
    await settingsPage.waitForLoadState('networkidle');
    await settingsPage.waitForTimeout(1000); // Give the page time to initialize
    expect(errors).toEqual([]);

    // Check settings form elements
    await expect(settingsPage.locator('#apiEndpoint')).toBeVisible();
    await expect(settingsPage.locator('#pagesUrl')).toBeVisible();
    await expect(settingsPage.locator('#clientId')).toBeVisible();

    // Fill and submit settings
    await settingsPage.fill('#apiEndpoint', 'https://api-staging.chroniclesync.xyz');
    await settingsPage.fill('#pagesUrl', 'https://chroniclesync.pages.dev');
    await settingsPage.fill('#clientId', 'test-client');
    await settingsPage.locator('button[type="submit"]').click();

    // Verify success message
    await expect(settingsPage.locator('#settings-message')).toHaveText('Settings saved successfully!');
    await expect(settingsPage.locator('#settings-message')).toHaveClass(/success/);

    // Verify storage was updated
    const config = await settingsPage.evaluate(() => {
      return new Promise<{
        apiEndpoint: string;
        pagesUrl: string;
        clientId: string;
        firstRun: boolean;
      }>((resolve) => {
        chrome.storage.sync.get(null, (result) => {
          resolve(result as { apiEndpoint: string; pagesUrl: string; clientId: string; firstRun: boolean });
        });
      });
    });

    expect(config.apiEndpoint).toBe('https://api-staging.chroniclesync.xyz');
    expect(config.pagesUrl).toBe('https://chroniclesync.pages.dev');
    expect(config.clientId).toBe('test-client');
    expect(config.firstRun).toBe(false);
  });
});