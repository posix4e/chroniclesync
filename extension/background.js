async function getDeviceInfo() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = await chrome.storage.local.get('deviceId').then(result => {
    if (!result.deviceId) {
      const newDeviceId = 'device_' + Math.random().toString(36).substring(2);
      chrome.storage.local.set({ deviceId: newDeviceId });
      return newDeviceId;
    }
    return result.deviceId;
  });

  return {
    deviceId,
    platform,
    userAgent,
    timestamp: new Date().toISOString()
  };
}

async function syncHistory(url, title, retryCount = 0) {
  try {
    const config = await chrome.storage.sync.get(['apiEndpoint', 'clientId']);
    
    // Validate configuration
    if (!config.apiEndpoint || !config.clientId) {
      console.error('Missing configuration. Please set apiEndpoint and clientId in extension settings.');
      return;
    }

    const deviceInfo = await getDeviceInfo();

    const historyData = {
      url,
      title,
      clientId: config.clientId,
      ...deviceInfo
    };

    const response = await fetch(`${config.apiEndpoint}/v1/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL(''),
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify(historyData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }

    console.debug('History synced:', historyData);
    
    // Store last successful sync time
    await chrome.storage.local.set({ lastSyncTime: new Date().toISOString() });
  } catch (error) {
    console.error('Error syncing history:', error);

    // Retry logic for network errors
    if (retryCount < 3 && (error instanceof TypeError || error.message.includes('Failed to fetch'))) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.debug(`Retrying in ${delay}ms...`);
      setTimeout(() => syncHistory(url, title, retryCount + 1), delay);
    } else {
      // Store failed sync attempt for later retry
      const failedSyncs = await chrome.storage.local.get('failedSyncs').then(result => result.failedSyncs || []);
      failedSyncs.push({ url, title, timestamp: new Date().toISOString() });
      await chrome.storage.local.set({ failedSyncs });
    }
  }
}

// Retry failed syncs periodically
async function retryFailedSyncs() {
  const { failedSyncs = [] } = await chrome.storage.local.get('failedSyncs');
  if (failedSyncs.length > 0) {
    console.debug(`Retrying ${failedSyncs.length} failed syncs...`);
    
    // Process each failed sync
    const remainingFailedSyncs = [];
    for (const sync of failedSyncs) {
      try {
        await syncHistory(sync.url, sync.title);
      } catch (error) {
        // Keep failed syncs that are less than 24 hours old
        const syncTime = new Date(sync.timestamp);
        if (Date.now() - syncTime.getTime() < 24 * 60 * 60 * 1000) {
          remainingFailedSyncs.push(sync);
        }
      }
    }

    // Update failed syncs list
    await chrome.storage.local.set({ failedSyncs: remainingFailedSyncs });
  }
}

// Initialize periodic retry
const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(retryFailedSyncs, RETRY_INTERVAL);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Don't sync chrome:// and chrome-extension:// URLs
    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      syncHistory(tab.url, tab.title);
    }
  }
});

// Listen for extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  // Clear any existing failed syncs on update/install
  await chrome.storage.local.set({ failedSyncs: [] });
  
  // Initialize device ID if not already set
  await getDeviceInfo();
});