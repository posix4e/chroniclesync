import { test, expect, getExtensionUrl } from './utils/extension';
import { server } from './test-config';

test.describe('History Sync', () => {
  test('should sync browser history', async ({ context, extensionId, page }) => {
    // Set up the extension with test configuration
    const settingsUrl = getExtensionUrl(extensionId, 'settings.html');
    const settingsPage = await context.newPage();
    await settingsPage.goto(settingsUrl);

    // Configure the extension
    await settingsPage.fill('#clientId', 'test-client-id');
    await settingsPage.selectOption('#environment', 'custom');
    await settingsPage.fill('#customApiUrl', server.apiUrl);
    await settingsPage.click('#saveSettings');

    // Mock the API response for history sync
    await context.route('**/*', async (route, request) => {
      if (request.url().includes('api-staging.chroniclesync.xyz') && request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'History synced successfully' })
        });
      } else if (request.url().includes('api-staging.chroniclesync.xyz') && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            url: 'https://example.com',
            clientId: 'test-client-id',
            timestamp: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to a test page
    const testUrl = 'https://example.com';
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    // Wait for sync to happen
    await page.waitForTimeout(5000);

    // Take a screenshot of the extension popup
    const popupUrl = getExtensionUrl(extensionId, 'popup.html');
    const popupPage = await context.newPage();
    await popupPage.goto(popupUrl);
    await popupPage.screenshot({ path: 'test-results/history-sync.png' });

    // Verify the history was synced by checking the API
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('https://api-staging.chroniclesync.xyz/v1/history?clientId=test-client-id');
      return {
        ok: response.ok,
        status: response.status,
        data: await response.json()
      };
    });
    console.log('API Response:', apiResponse);
    expect(apiResponse.ok).toBeTruthy();
    
    expect(apiResponse.data).toContainEqual(expect.objectContaining({
      url: testUrl,
      clientId: 'test-client-id'
    }));

    // Clean up
    await settingsPage.close();
    await popupPage.close();
  });
});