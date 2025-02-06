import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('History Sync', () => {
  test('should sync history when client ID is set', async ({ context, extensionId }) => {
    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popup.waitForLoadState('domcontentloaded');

    // Take screenshot of initial state
    await popup.screenshot({ path: 'test-results/history-sync-1-initial.png' });

    // Enter client ID
    const clientIdInput = popup.locator('#clientId');
    await clientIdInput.fill('test-client-id');
    await popup.screenshot({ path: 'test-results/history-sync-2-client-id.png' });

    // Click initialize button
    const initButton = popup.locator('button:text("Initialize")');
    await initButton.click();
    await popup.screenshot({ path: 'test-results/history-sync-3-initialized.png' });

    // Verify sync button appears
    const syncButton = popup.locator('button:text("Sync with Server")');
    await expect(syncButton).toBeVisible();

    // Click sync button
    await syncButton.click();
    await popup.screenshot({ path: 'test-results/history-sync-4-synced.png' });

    // Verify success message
    const dialog = await popup.waitForEvent('dialog');
    expect(dialog.message()).toContain('History sync successful');
    await dialog.accept();
  });

  test('should handle sync failure gracefully', async ({ context, extensionId }) => {
    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popup.waitForLoadState('domcontentloaded');

    // Mock API to return error
    await popup.route('**/api/sync', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    // Enter client ID and initialize
    const clientIdInput = popup.locator('#clientId');
    await clientIdInput.fill('test-client-id');
    const initButton = popup.locator('button:text("Initialize")');
    await initButton.click();

    // Click sync button
    const syncButton = popup.locator('button:text("Sync with Server")');
    await syncButton.click();

    // Verify error message
    const dialog = await popup.waitForEvent('dialog');
    expect(dialog.message()).toContain('Sync failed');
    await dialog.accept();
  });
});