import { test, expect, getExtensionUrl } from './utils/extension';

async function getClientData(clientId: string): Promise<any> {
  const apiUrl = process.env.API_URL || 'https://api-staging.chroniclesync.xyz';
  const response = await fetch(`${apiUrl}/client?clientId=${clientId}`, {
    headers: {
      'Authorization': 'Bearer francesisthebest'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get client data: ${response.status}`);
  }
  
  return response.json();
}

async function getClientId(context: any): Promise<string> {
  // Get the background page
  const backgroundPages = context.backgroundPages();
  const backgroundPage = backgroundPages[0];
  
  // Execute script to get clientId from storage
  const result = await backgroundPage.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.get('clientId', (data) => {
        resolve(data.clientId);
      });
    });
  });
  
  return result as string;
}

const TEST_URLS = [
  { url: 'https://example.com', title: 'Example Domain' },
  { url: 'https://www.mozilla.org', title: 'Mozilla' },
  { url: 'https://github.com', title: 'GitHub' }
];

test.describe('History Sync', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Configure extension settings
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.screenshot({ path: 'test-results/settings-initial.png' });

    // Set staging environment
    await settingsPage.selectOption('#environment', 'staging');
    await settingsPage.click('#saveSettings');
    await settingsPage.screenshot({ path: 'test-results/settings-configured.png' });
    await settingsPage.close();
  });

  test('should sync history items to staging server', async ({ context, extensionId }) => {
    // Get the client ID that will be used for syncing
    const clientId = await getClientId(context);
    console.log('Using client ID:', clientId);

    // Visit test URLs
    const page = await context.newPage();
    const visitedUrls = new Set<string>();
    
    for (const testUrl of TEST_URLS) {
      await page.goto(testUrl.url);
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: `test-results/${new URL(testUrl.url).hostname}.png` });
      
      // Store the actual URL after any redirects
      visitedUrls.add(page.url());
    }

    // Wait for initial sync (background.js has a delay)
    await page.waitForTimeout(2000);

    // Verify sync status in extension popup
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popupPage.screenshot({ path: 'test-results/popup-after-sync.png' });

    const statusText = await popupPage.textContent('#status');
    expect(statusText).toContain('Last sync:');

    // Trigger manual sync and verify
    await popupPage.click('#syncNow');
    await popupPage.waitForTimeout(1000);
    await popupPage.screenshot({ path: 'test-results/popup-after-manual-sync.png' });

    const newStatusText = await popupPage.textContent('#status');
    expect(newStatusText).toContain('Last sync:');
    expect(Date.parse(newStatusText.split('Last sync:')[1].trim())).toBeGreaterThan(
      Date.parse(statusText.split('Last sync:')[1].trim())
    );

    // Verify data in the worker
    console.log('Fetching synced data from worker...');
    const workerData = await getClientData(clientId);
    console.log('Worker data:', JSON.stringify(workerData, null, 2));

    // Verify history items
    expect(workerData.history).toBeDefined();
    expect(Array.isArray(workerData.history)).toBe(true);
    expect(workerData.history.length).toBeGreaterThanOrEqual(TEST_URLS.length);

    // Verify each test URL is in the synced history
    for (const url of visitedUrls) {
      const found = workerData.history.some((item: any) => item.url === url);
      expect(found).toBe(true);
    }

    // Verify device info
    expect(workerData.deviceInfo).toBeDefined();
    expect(workerData.deviceInfo.platform).toBeDefined();
    expect(workerData.deviceInfo.browserName).toBeDefined();
    expect(workerData.deviceInfo.browserVersion).toBeDefined();

    // Verify timestamps
    const timestamps = workerData.history.map((item: any) => item.visitTime);
    const now = Date.now();
    for (const timestamp of timestamps) {
      expect(timestamp).toBeLessThanOrEqual(now);
      expect(timestamp).toBeGreaterThan(now - 1000 * 60 * 5); // Within last 5 minutes
    }
  });

  test('should handle offline sync gracefully', async ({ context, extensionId }) => {
    // Get the client ID
    const clientId = await getClientId(context);
    console.log('Using client ID for offline test:', clientId);

    // Disable network
    await context.setOffline(true);

    // Visit test URLs while offline
    const page = await context.newPage();
    const offlineUrls = new Set<string>();
    
    for (const testUrl of TEST_URLS.slice(0, 2)) { // Visit first two test URLs
      await page.goto(testUrl.url).catch(() => {}); // Ignore navigation errors when offline
      offlineUrls.add(testUrl.url);
    }
    await page.screenshot({ path: 'test-results/offline-page.png' });

    // Check popup status
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await popupPage.screenshot({ path: 'test-results/popup-offline.png' });

    const statusText = await popupPage.textContent('#status');
    expect(statusText).toContain('Offline');

    // Re-enable network
    await context.setOffline(false);
    await popupPage.waitForTimeout(2000);
    await popupPage.screenshot({ path: 'test-results/popup-back-online.png' });

    const newStatusText = await popupPage.textContent('#status');
    expect(newStatusText).toContain('Last sync:');

    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Verify data was synced after coming back online
    console.log('Fetching synced data after offline period...');
    const workerData = await getClientData(clientId);
    console.log('Worker data after offline:', JSON.stringify(workerData, null, 2));

    // Verify history items were synced
    expect(workerData.history).toBeDefined();
    expect(Array.isArray(workerData.history)).toBe(true);

    // Check that attempted offline visits were recorded locally and synced
    // Note: The actual URLs might not be in history since we were offline,
    // but the attempts should be recorded
    const recentHistory = workerData.history.filter((item: any) => {
      const timestamp = item.visitTime;
      const now = Date.now();
      return timestamp > now - 1000 * 60 * 5; // Within last 5 minutes
    });

    expect(recentHistory.length).toBeGreaterThan(0);
    console.log('Recent history after offline:', recentHistory);
  });

  test('should sync history across browser restarts', async ({ context, extensionId }) => {
    // Get the client ID that will persist across restarts
    const clientId = await getClientId(context);
    console.log('Using client ID for restart test:', clientId);

    // Visit initial URLs
    const page = await context.newPage();
    await page.goto(TEST_URLS[0].url);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/initial-visit.png' });

    // Get initial sync status and data
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    const initialStatus = await popupPage.textContent('#status');
    await popupPage.screenshot({ path: 'test-results/popup-before-restart.png' });

    // Get initial worker data
    console.log('Fetching initial worker data...');
    const initialWorkerData = await getClientData(clientId);
    const initialHistoryCount = initialWorkerData.history.length;
    console.log('Initial history count:', initialHistoryCount);

    // Close all pages to simulate browser restart
    const pages = context.pages();
    await Promise.all(pages.map(p => p.close()));

    // Visit more URLs after "restart"
    const newPage = await context.newPage();
    await newPage.goto(TEST_URLS[1].url);
    await newPage.waitForTimeout(2000);
    await newPage.screenshot({ path: 'test-results/after-restart-visit.png' });

    // Check sync status after "restart"
    const newPopupPage = await context.newPage();
    await newPopupPage.goto(getExtensionUrl(extensionId, 'popup.html'));
    await newPopupPage.screenshot({ path: 'test-results/popup-after-restart.png' });

    const finalStatus = await newPopupPage.textContent('#status');
    expect(Date.parse(finalStatus.split('Last sync:')[1].trim())).toBeGreaterThan(
      Date.parse(initialStatus.split('Last sync:')[1].trim())
    );

    // Verify data persistence in worker
    console.log('Fetching final worker data...');
    const finalWorkerData = await getClientData(clientId);
    console.log('Final worker data:', JSON.stringify(finalWorkerData, null, 2));

    // Verify history was persisted and new items were added
    expect(finalWorkerData.history.length).toBeGreaterThan(initialHistoryCount);

    // Verify both pre-restart and post-restart URLs are present
    const allUrls = [TEST_URLS[0].url, TEST_URLS[1].url];
    for (const url of allUrls) {
      const found = finalWorkerData.history.some((item: any) => item.url === url);
      expect(found).toBe(true);
    }

    // Verify device info persisted
    expect(finalWorkerData.deviceInfo).toEqual(initialWorkerData.deviceInfo);
  });
});