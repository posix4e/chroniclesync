import { test, expect, getExtensionUrl } from './utils/extension';

test('should sync browser history with the API', async ({ context, extensionId }) => {
  // Open settings page and configure client ID
  const settingsPage = await context.newPage();
  await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
  await settingsPage.screenshot({ path: 'test-results/settings-page.png' });
  
  // Set test client ID and environment
  await settingsPage.fill('#clientId', 'test-client-id');
  await settingsPage.selectOption('#environment', 'custom');
  await settingsPage.fill('#customApiUrl', process.env.API_URL || 'https://api-staging.chroniclesync.xyz');
  await settingsPage.click('#saveSettings');
  
  // Create a new page and visit some test URLs
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'test-results/example-page.png' });
  
  // Wait for sync to occur (we added a 1s delay in background.js)
  await page.waitForTimeout(2000);
  
  // Open extension popup to verify status
  const popupPage = await context.newPage();
  await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
  await popupPage.screenshot({ path: 'test-results/popup-page.png' });
  
  // Verify sync status in the extension popup
  const statusText = await popupPage.textContent('#status');
  expect(statusText).toContain('Last sync:');
});