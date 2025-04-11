import { test, expect, chromium } from '@playwright/test';
import { getExtensionId } from './utils/extension-helpers';
import { waitForHistorySync } from './utils/sync-helpers';
import { TEST_URLS } from './test-config';

test.describe('P2P Sync between multiple browser extensions', () => {
  test('Two browser extensions should sync history over GunDB p2p', async () => {
    // Launch two separate browser contexts with the extension installed
    const browserOne = await chromium.launch({ headless: false });
    const browserTwo = await chromium.launch({ headless: false });

    // Create contexts for both browsers
    const contextOne = await browserOne.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const contextTwo = await browserTwo.newContext({
      viewport: { width: 1280, height: 720 }
    });

    // Get extension IDs for both contexts
    const extensionIdOne = await getExtensionId(contextOne);
    const extensionIdTwo = await getExtensionId(contextTwo);

    // Open settings page in both browsers and configure GunDB
    const settingsPageOne = await contextOne.newPage();
    await settingsPageOne.goto(`chrome-extension://${extensionIdOne}/settings.html`);
    
    const settingsPageTwo = await contextTwo.newPage();
    await settingsPageTwo.goto(`chrome-extension://${extensionIdTwo}/settings.html`);

    // Configure the same mnemonic for both extensions to ensure they share the same identity
    const sharedMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    
    // Configure first extension
    await settingsPageOne.fill('#mnemonic', sharedMnemonic);
    await settingsPageOne.check('#useGunDB');
    await settingsPageOne.click('#saveSettings');
    
    // Configure second extension with the same settings
    await settingsPageTwo.fill('#mnemonic', sharedMnemonic);
    await settingsPageTwo.check('#useGunDB');
    await settingsPageTwo.click('#saveSettings');
    
    // Wait for settings to be saved
    await settingsPageOne.waitForTimeout(1000);
    await settingsPageTwo.waitForTimeout(1000);

    // Create a new page in the first browser and visit a test URL
    const pageOne = await contextOne.newPage();
    await pageOne.goto(TEST_URLS.SIMPLE_PAGE);
    await pageOne.waitForLoadState('networkidle');
    
    // Wait for the history to be processed
    await pageOne.waitForTimeout(2000);
    
    // Manually trigger sync in the first browser
    const popupOne = await contextOne.newPage();
    await popupOne.goto(`chrome-extension://${extensionIdOne}/popup.html`);
    await popupOne.click('#syncNowButton');
    
    // Wait for sync to complete
    await popupOne.waitForTimeout(3000);
    
    // Open history page in the second browser
    const historyPageTwo = await contextTwo.newPage();
    await historyPageTwo.goto(`chrome-extension://${extensionIdTwo}/history.html`);
    
    // Manually trigger sync in the second browser
    const popupTwo = await contextTwo.newPage();
    await popupTwo.goto(`chrome-extension://${extensionIdTwo}/popup.html`);
    await popupTwo.click('#syncNowButton');
    
    // Wait for sync to complete
    await popupTwo.waitForTimeout(3000);
    
    // Refresh the history page to see the synced entries
    await historyPageTwo.reload();
    await historyPageTwo.waitForLoadState('networkidle');
    
    // Verify that the history entry from the first browser appears in the second browser
    const historyEntries = await historyPageTwo.locator('.history-entry').count();
    expect(historyEntries).toBeGreaterThan(0);
    
    // Check if the specific URL visited in the first browser is visible in the second browser's history
    const urlVisible = await historyPageTwo.locator(`.history-entry:has-text("${TEST_URLS.SIMPLE_PAGE}")`).isVisible();
    expect(urlVisible).toBeTruthy();
    
    // Clean up
    await browserOne.close();
    await browserTwo.close();
  });
});