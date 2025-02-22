import { getConfig } from './config.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize extension
async function initializeExtension() {
  try {
    // Ensure storage is accessible
    await chrome.storage.local.get(['initialized']);

    // Load initial config
    await getConfig();

    // Mark as initialized
    await chrome.storage.local.set({ initialized: true });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

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

async function syncHistory(forceFullSync = false) {
  try {
    const initialized = await chrome.storage.local.get(['initialized']);
    if (!initialized.initialized) {
      const success = await initializeExtension();
      if (!success) {
        console.debug('Sync skipped: Extension not initialized');
        return;
      }
    }

    const config = await getConfig();

    // Skip sync if using default client ID
    if (!config.clientId || config.clientId === 'extension-default') {
      // eslint-disable-next-line no-console
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    // eslint-disable-next-line no-console
    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    // Get stored lastSync time
    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    // Use stored lastSync time unless forcing full sync
    const startTime = forceFullSync ? 0 : storedLastSync;

    // Get history since last sync
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000 // Increased limit for full sync
    });

    if (historyItems.length === 0) {
      return;
    }

    // Get detailed visit information for each history item
    const historyData = await Promise.all(historyItems.map(async item => {
      // Get all visits for this URL
      const visits = await chrome.history.getVisits({ url: item.url });
      
      // Filter visits within our time range and map them
      const visitData = visits
        .filter(visit => visit.visitTime >= startTime && visit.visitTime <= now)
        .map(visit => ({
          url: item.url,
          title: item.title,
          visitTime: visit.visitTime,
          visitId: visit.visitId,
          referringVisitId: visit.referringVisitId,
          transition: visit.transition,
          ...systemInfo
        }));

      return visitData;
    }));

    // Flatten the array of visit arrays
    const flattenedHistoryData = historyData.flat();

    // Only proceed if we have visits to sync
    if (flattenedHistoryData.length === 0) {
      return;
    }

    const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: flattenedHistoryData,
        deviceInfo: systemInfo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the latest visit time from our synced data
    const latestVisitTime = Math.max(...flattenedHistoryData.map(item => item.visitTime));
    
    // Store lastSync time in storage, but only update if we have a newer time
    const currentLastSync = (await chrome.storage.local.get(['lastSync'])).lastSync || 0;
    if (latestVisitTime > currentLastSync) {
      await chrome.storage.local.set({ lastSync: latestVisitTime });
    }

    try {
      // Only send message if there are active listeners
      chrome.runtime.sendMessage({ type: 'syncComplete' }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }
    // eslint-disable-next-line no-console
    console.debug(`Successfully synced ${historyData.length} history items`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error syncing history:', error);
    // Don't throw the error to prevent the extension from breaking
    return;
  }
}

// Initial sync with full history
syncHistory(true);

// Set up periodic sync
setInterval(() => syncHistory(false), SYNC_INTERVAL);

// Listen for navigation events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    // eslint-disable-next-line no-console
    console.debug(`Navigation to: ${changeInfo.url}`);
    // Trigger sync after a short delay to allow history to be updated
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
    // Check initialization first
    chrome.storage.local.get(['initialized']).then(async result => {
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
        // eslint-disable-next-line no-console
        console.error('Error getting client ID:', error);
        sendResponse({ error: 'Failed to get client ID' });
      }
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'triggerSync') {
    // Trigger manual sync with full history
    syncHistory(true)
      .then(() => {
        // Send success response and notify popup about sync completion
        sendResponse({ success: true, message: 'Sync successful' });
        try {
          chrome.runtime.sendMessage({ type: 'syncComplete', success: true }).catch(() => {
            // Ignore error when no receivers are present
          });
        } catch {
          // Catch any other messaging errors
        }
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Manual sync failed:', error);
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (request.type === 'getHistory') {
    const limit = request.limit || 50;
    chrome.history.search({
      text: '',
      maxResults: limit,
      startTime: 0
    }).then(async historyItems => {
      // Get detailed visit information for each history item
      const historyData = await Promise.all(historyItems.map(async item => {
        const visits = await chrome.history.getVisits({ url: item.url });
        const latestVisit = visits[visits.length - 1];
        return {
          url: item.url,
          title: item.title,
          visitTime: latestVisit.visitTime,
          visitId: latestVisit.visitId,
          referringVisitId: latestVisit.referringVisitId,
          transition: latestVisit.transition,
          syncStatus: 'pending' // Default status
        };
      }));
      sendResponse(historyData);
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error fetching history:', error);
      sendResponse({ error: error.message });
    });
    return true; // Will respond asynchronously
  }
});