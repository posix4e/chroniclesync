import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('History Sync', () => {
  test.beforeEach(async ({ context }) => {
    context.on('page', page => {
      page.on('dialog', dialog => dialog.accept());
    });
  });

  test('history sync feature', async ({ context, extensionId }) => {

  // Load the extension popup
  const popupPage = await context.newPage();
  await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
  await popupPage.waitForLoadState('networkidle');
  await popupPage.waitForSelector('#clientId');
  await popupPage.screenshot({ path: 'test-results/history-sync-initial.png' });

  // Enter client ID
  const clientId = 'test-client-id';
  await popupPage.fill('#clientId', clientId);
  await popupPage.click('text=Initialize');
  await popupPage.screenshot({ path: 'test-results/history-sync-client-id-saved.png' });

  // Verify sync section is visible
  await expect(popupPage.locator('text=Sync with Server')).toBeVisible();

  // Mock the API response
  await popupPage.route('**/api/history', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // Wait for sync button to be enabled
  await popupPage.waitForSelector('text=Sync with Server');
  await popupPage.waitForFunction(() => {
    const button = document.querySelector('button') as HTMLButtonElement;
    return button && !button.disabled;
  });

  // Click sync button and wait for dialog
  const dialogPromise = popupPage.waitForEvent('dialog');
  await popupPage.click('text=Sync with Server');
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('Sync successful');
  await popupPage.screenshot({ path: 'test-results/history-sync-complete.png' });

  // Clean up
  await popupPage.close();
  });
});