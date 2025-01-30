import { test, expect, getExtensionUrl } from './utils/extension';
import { server } from './test-config';

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

  test('browser history sync workflow', async ({ context, extensionId, page }) => {
    // 1. Set up test data
    const testClientId = 'test-client-' + Date.now();
    const testUrl = 'https://example.com/test-page';
    const testTitle = 'Test Page Title';

    // 2. Open extension popup and configure settings
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popupPage.waitForLoadState('networkidle');

    // Fill in client ID
    await popupPage.locator('#clientId').fill(testClientId);
    
    // Save settings
    await popupPage.getByText('Save Settings').click();
    
    // Wait for success message
    await expect(popupPage.locator('.message')).toContainText('Settings saved successfully');

    // 3. Create a test history entry
    const testPage = await context.newPage();
    await testPage.goto(testUrl);
    await testPage.evaluate((title) => {
      document.title = title;
    }, testTitle);
    
    // Wait for history sync
    await page.waitForTimeout(2000);

    // 4. Open history view page
    const historyPage = await context.newPage();
    await historyPage.goto(`${server.pagesUrl}?clientId=${testClientId}`);
    await historyPage.waitForLoadState('networkidle');

    // 5. Verify history entry
    const historyItem = historyPage.locator('.history-item').first();
    await expect(historyItem.locator('.history-title')).toContainText(testTitle);
    await expect(historyItem.locator('.history-url')).toContainText(testUrl);

    // Verify device info is present
    await expect(historyItem.locator('.history-meta')).toContainText('Device:');
    await expect(historyItem.locator('.history-meta')).toContainText('OS:');

    // Take a screenshot of the history view
    await historyPage.screenshot({
      path: 'test-results/history-view.png',
      fullPage: true
    });
  });
});