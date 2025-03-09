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

  test('API health check should be successful', async ({ page, context, extensionId }) => {
    // First, set up a client ID through the settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));

    // Wait for initial mnemonic generation
    await settingsPage.waitForTimeout(1000);
    let mnemonic = await settingsPage.locator('#mnemonic').inputValue();
    let clientId = await settingsPage.locator('#clientId').inputValue();

    // Wait for up to 5 seconds for the mnemonic to be generated
    for (let i = 0; i < 5; i++) {
      if (mnemonic && clientId) break;
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
    }

    // If still no mnemonic, try generating one
    if (!mnemonic || !clientId) {
      await settingsPage.locator('#generateMnemonic').click();
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
      await settingsPage.locator('#saveSettings').click();
      await settingsPage.waitForTimeout(1000);
    }

    // Wait for up to 5 seconds for the mnemonic to be generated
    for (let i = 0; i < 5; i++) {
      if (mnemonic && clientId) break;
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
    }

    // Ensure we have a valid mnemonic and client ID
    if (!mnemonic || !clientId) {
      throw new Error('Failed to generate mnemonic and client ID');
    }

    // Save the settings and wait for them to be saved
    await settingsPage.locator('#saveSettings').click();
    await settingsPage.waitForTimeout(1000);

    // Now test the API health endpoint with the client ID
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    
    // Wait for the settings to be saved
    await settingsPage.waitForTimeout(1000);

    const healthResponse = await page.request.get(`${apiUrl}/health`, {
      headers: {
        'X-Client-Id': clientId
      }
    });
    console.log('Health check status:', healthResponse.status());
    
    let responseBody;
    try {
      responseBody = await healthResponse.json();
    } catch (error) {
      const responseText = await healthResponse.text();
      console.log('Health check response text:', responseText);
      if (responseText === 'Client ID required') {
        throw new Error('Client ID was not properly set in the request headers');
      }
      throw error;
    }
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
});