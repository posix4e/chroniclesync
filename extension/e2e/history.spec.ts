import { test, expect, getExtensionUrl } from './utils/extension';

test('history sync setup and functionality', async ({ page, extensionId }) => {
  // Navigate to the settings page
  await page.goto(getExtensionUrl(extensionId, 'settings.html'));
  await page.waitForLoadState('domcontentloaded');

  // Fill in the client ID
  const clientIdInput = await page.locator('#clientId');
  await clientIdInput.fill('test-client-id');

  // Fill in the API URL
  const apiUrlInput = await page.locator('#apiUrl');
  await apiUrlInput.fill('https://api-staging.chroniclesync.xyz');

  // Save settings
  await page.locator('#saveSettings').click();

  // Wait for success message to appear
  await page.waitForSelector('.status-message', { state: 'attached' });
  const successMessage = await page.locator('.status-message');
  await expect(successMessage).toHaveText('Settings saved successfully!');

  // Wait for success message to disappear
  await page.waitForSelector('.status-message', { state: 'detached' });

  // Verify settings are saved
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await expect(clientIdInput).toHaveValue('test-client-id');
  await expect(apiUrlInput).toHaveValue('https://api-staging.chroniclesync.xyz');
});