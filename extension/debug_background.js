import { getConfig } from './debug_config.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize extension
async function initializeExtension() {
  try {
    console.log('Initializing extension...');
    // Ensure storage is accessible
    await chrome.storage.local.get(['initialized']);

    // Load initial config
    const config = await getConfig();
    console.log('Loaded config:', config);

    // Mark as initialized
    await chrome.storage.local.set({ initialized: true });
    console.log('Extension initialized successfully');

    return true;
  } catch (error) {
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
    console.log('Starting syncHistory...');
    const initialized = await chrome.storage.local.get(['initialized']);
    console.log('Initialization status:', initialized);
    
    if (!initialized.initialized) {
      const success = await initializeExtension();
      if (!success) {
        console.debug('Sync skipped: Extension not initialized');
        return;
      }
    }

    const config = await getConfig();
    console.log('Current config:', config);

    // Skip sync if using default client ID
    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    // Get stored lastSync time
    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;
    console.log('Last sync time:', new Date(storedLastSync).toISOString());

    // Use stored lastSync time unless forcing full sync
    const startTime = forceFullSync ? 0 : storedLastSync;

    // Get history since last sync
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000 // Increased limit for full sync
    });

    console.log(`Found ${historyItems.length} history items to sync`);

    if (historyItems.length === 0) {
      console.log('No history items to sync');
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
      console.log('No visits to sync after filtering');
      return;
    }

    console.log(`Sending ${flattenedHistoryData.length} visits to server...`);
    console.log('API endpoint:', config.apiEndpoint);

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

    console.log('Server response:', await response.json());

    // Get the latest visit time from our synced data
    const latestVisitTime = Math.max(...flattenedHistoryData.map(item => item.visitTime));
    console.log('Latest visit time:', new Date(latestVisitTime).toISOString());
    
    // Store lastSync time in storage, but only update if we have a newer time
    const currentLastSync = (await chrome.storage.local.get(['lastSync'])).lastSync || 0;
    if (latestVisitTime > currentLastSync) {
      console.log('Updating lastSync time in storage');
      await chrome.storage.local.set({ lastSync: latestVisitTime });
      
      // Also update in sync storage for the popup
      await chrome.storage.sync.set({ lastSync: latestVisitTime });
    }

    try {
      // Only send message if there are active listeners
      console.log('Sending syncComplete message');
      chrome.runtime.sendMessage({ type: 'syncComplete' }).catch(() => {
        console.log('No receivers for syncComplete message');
      });
    } catch (error) {
      console.error('Error sending syncComplete message:', error);
    }
    
    console.log(`Successfully synced ${historyData.length} history items`);
  } catch (error) {
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
    console.debug(`Navigation to: ${changeInfo.url}`);
    // Trigger sync after a short delay to allow history to be updated
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
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
        console.error('Error getting client ID:', error);
        sendResponse({ error: 'Failed to get client ID' });
      }
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'triggerSync') {
    console.log('Manual sync triggered');
    // Trigger manual sync with full history
    syncHistory(true)
      .then(() => {
        // Send success response and notify popup about sync completion
        console.log('Manual sync completed successfully');
        sendResponse({ success: true, message: 'Sync successful' });
        try {
          chrome.runtime.sendMessage({ type: 'syncComplete', success: true }).catch(() => {
            console.log('No receivers for syncComplete message');
          });
        } catch (error) {
          console.error('Error sending syncComplete message:', error);
        }
      })
      .catch(error => {
        console.error('Manual sync failed:', error);
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  }
});