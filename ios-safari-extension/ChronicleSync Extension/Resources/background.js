// Safari iOS Extension Background Script

// Configuration
const DEFAULT_CONFIG = {
  clientId: 'extension-default',
  apiEndpoint: 'https://api-staging.chroniclesync.xyz/sync',
  syncInterval: 5 * 60 * 1000 // 5 minutes
};

// System information
async function getSystemInfo() {
  return {
    deviceId: await getOrCreateDeviceId(),
    deviceName: 'iOS Safari',
    deviceType: 'mobile',
    browser: 'safari',
    platform: 'ios',
    version: '1.0'
  };
}

// Get or create a unique device ID
async function getOrCreateDeviceId() {
  const stored = await browser.storage.local.get(['deviceId']);
  if (stored.deviceId) {
    return stored.deviceId;
  }
  
  const deviceId = 'ios-' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  await browser.storage.local.set({ deviceId });
  return deviceId;
}

// Get configuration
async function getConfig() {
  const stored = await browser.storage.local.get(['config']);
  return stored.config || DEFAULT_CONFIG;
}

// Initialize extension
async function initializeExtension() {
  try {
    await browser.storage.local.get(['initialized']);
    await getConfig();
    await browser.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

// Sync history with server
async function syncHistory(forceFullSync = false) {
  try {
    const initialized = await browser.storage.local.get(['initialized']);
    if (!initialized.initialized) {
      const success = await initializeExtension();
      if (!success) {
        console.debug('Sync skipped: Extension not initialized');
        return;
      }
    }

    const config = await getConfig();

    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    const stored = await browser.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const startTime = forceFullSync ? 0 : storedLastSync;

    // Safari iOS has limitations with history API, so we'll use a simplified approach
    // We'll collect history from the tabs API instead
    const tabs = await browser.tabs.query({});
    
    const historyData = tabs.map(tab => ({
      url: tab.url,
      title: tab.title || '',
      visitTime: now,
      visitId: Math.random().toString(36).substring(2, 15),
      referringVisitId: '0',
      transition: 'link',
      ...systemInfo
    }));

    // Store history locally
    const storedHistory = await browser.storage.local.get(['history']) || { history: [] };
    const combinedHistory = [...storedHistory.history, ...historyData];
    await browser.storage.local.set({ history: combinedHistory });

    // Sync with server
    const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: historyData,
        deviceInfo: systemInfo,
        lastSync: storedLastSync
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const syncResponse = await response.json();

    // Update last sync time
    const newLastSync = syncResponse.lastSyncTime || now;
    const lastSyncDate = new Date(newLastSync).toLocaleString();
    await browser.storage.local.set({ lastSync: newLastSync });
    await browser.storage.sync.set({ lastSync: lastSyncDate });

    // Notify popup of sync completion
    try {
      browser.runtime.sendMessage({ 
        type: 'syncComplete',
        stats: {
          sent: historyData.length,
          received: syncResponse.history?.length || 0,
          devices: syncResponse.devices?.length || 0
        }
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }

    console.debug('Successfully completed sync');
  } catch (error) {
    console.error('Error syncing history:', error);
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      browser.runtime.sendMessage({ 
        type: 'syncError',
        error: errorMessage
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }
  }
}

// Initial sync with full history
syncHistory(true);

// Set up periodic sync
setInterval(() => syncHistory(false), DEFAULT_CONFIG.syncInterval);

// Listen for navigation events
browser.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
    browser.storage.local.get(['initialized']).then(async result => {
      if (!result.initialized) {
        const success = await initializeExtension();
        if (!success) {
          sendResponse({ error: 'Extension not initialized' });
          return;
        }
      }

      try {
        const config = await getConfig();
        sendResponse({ clientId: config.clientId === 'extension-default' ? null : config.clientId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error getting client ID:', errorMessage);
        sendResponse({ error: 'Failed to get client ID' });
      }
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'triggerSync') {
    syncHistory(true)
      .then(() => {
        sendResponse({ success: true, message: 'Sync successful' });
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Manual sync failed:', errorMessage);
        sendResponse({ error: errorMessage });
      });
    return true; // Will respond asynchronously
  } else if (request.type === 'getHistory') {
    browser.storage.local.get(['history']).then(result => {
      const history = result.history || [];
      sendResponse(history);
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching history:', errorMessage);
      sendResponse({ error: errorMessage });
    });
    return true; // Will respond asynchronously
  }
});