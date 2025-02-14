import { getConfig } from './config.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastSync = 0;

async function getSystemInfo() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = await getDeviceId();
  
  return {
    deviceId,
    platform,
    userAgent,
    browserName: 'Chrome',
    browserVersion: /Chrome\/([0-9.]+)/.exec(userAgent)?.[1] || 'unknown'
  };
}

async function getDeviceId() {
  const result = await chrome.storage.local.get(['deviceId']);
  if (result.deviceId) {
    return result.deviceId;
  }
  const deviceId = 'device_' + Math.random().toString(36).substring(2);
  await chrome.storage.local.set({ deviceId });
  return deviceId;
}

async function syncHistory() {
  const config = await getConfig();
  
  // Skip sync if using default client ID
  if (config.clientId === 'extension-default') {
    // eslint-disable-next-line no-console
    console.debug('Sync paused: Using default client ID');
    return;
  }

  const systemInfo = await getSystemInfo();
  const now = Date.now();
  
  // Get history since last sync
  const historyItems = await chrome.history.search({
    text: '',
    startTime: lastSync,
    endTime: now,
    maxResults: 1000
  });

  if (historyItems.length === 0) {
    return;
  }

  const historyData = historyItems.map(item => ({
    url: item.url,
    title: item.title,
    visitTime: item.lastVisitTime,
    visitCount: item.visitCount,
    ...systemInfo
  }));

  try {
    const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: historyData,
        deviceInfo: systemInfo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    lastSync = now;
    await chrome.storage.sync.set({ lastSync: now });
    
    try {
      // Notify any active extension views (popup, options page, etc.)
      await chrome.runtime.sendMessage({ type: 'syncComplete' });
    } catch (error) {
      // Ignore errors when no listeners are available
      if (!error.message.includes('Receiving end does not exist')) {
        // eslint-disable-next-line no-console
        console.error('Error sending sync complete message:', error);
      }
    }

    // eslint-disable-next-line no-console
    console.debug(`Successfully synced ${historyData.length} history items`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error syncing history:', error);
  }
}

// Initial sync
syncHistory();

// Set up periodic sync
setInterval(syncHistory, SYNC_INTERVAL);

// Listen for navigation events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    // eslint-disable-next-line no-console
    console.debug(`Navigation to: ${changeInfo.url}`);
    // Trigger sync after a short delay to allow history to be updated
    setTimeout(syncHistory, 1000);
  }
});