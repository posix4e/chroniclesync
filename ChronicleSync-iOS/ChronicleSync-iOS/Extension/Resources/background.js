// Import the iOS Storage Adapter
// Note: In the actual implementation, we would import from the shared code
// but for this example, we're using a simplified approach

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Configuration
let config = {
  baseUrl: 'https://api.chroniclesync.xyz',
  clientId: ''
};

// Initialize storage adapter
const storageAdapter = new IOSStorageAdapter();

// Initialize the extension
async function initializeExtension() {
  try {
    await storageAdapter.init();
    
    // Load config from storage
    const storedConfig = await browser.storage.local.get(['baseUrl', 'clientId']);
    if (storedConfig.baseUrl) {
      config.baseUrl = storedConfig.baseUrl;
    }
    if (storedConfig.clientId) {
      config.clientId = storedConfig.clientId;
    }
    
    await browser.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

// Sync history with the server
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

    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    console.debug('Starting sync with client ID:', config.clientId);

    // Get last sync time
    const lastSyncData = await browser.storage.local.get(['lastSyncTime']);
    const lastSyncTime = forceFullSync ? 0 : (lastSyncData.lastSyncTime || 0);

    // Get unsynced entries
    const unsyncedEntries = await storageAdapter.getUnsyncedEntries();
    console.debug(`Found ${unsyncedEntries.length} unsynced entries`);

    if (unsyncedEntries.length === 0 && !forceFullSync) {
      console.debug('No entries to sync and not forcing full sync, skipping');
      return;
    }

    // Send to server
    const response = await fetch(`${config.baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId
      },
      body: JSON.stringify({
        history: unsyncedEntries,
        lastSyncTime,
        deviceInfo: await getDeviceInfo()
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const syncResponse = await response.json();
    
    // Process server response
    if (syncResponse.history && syncResponse.history.length > 0) {
      await storageAdapter.mergeRemoteEntries(syncResponse.history);
      console.debug(`Merged ${syncResponse.history.length} entries from server`);
    }

    // Update devices
    if (syncResponse.devices && syncResponse.devices.length > 0) {
      for (const device of syncResponse.devices) {
        await storageAdapter.updateDevice(device);
      }
      console.debug(`Updated ${syncResponse.devices.length} devices`);
    }

    // Mark entries as synced
    for (const entry of unsyncedEntries) {
      await storageAdapter.markAsSynced(entry.visitId);
    }

    // Update last sync time
    await browser.storage.local.set({ 
      lastSyncTime: syncResponse.lastSyncTime || Date.now(),
      lastSyncStatus: 'success',
      lastSyncStats: {
        sent: unsyncedEntries.length,
        received: syncResponse.history ? syncResponse.history.length : 0,
        devices: syncResponse.devices ? syncResponse.devices.length : 0
      }
    });

    console.debug('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    await browser.storage.local.set({ 
      lastSyncStatus: 'error',
      lastSyncError: error.message
    });
  }
}

// Get device information
async function getDeviceInfo() {
  const platform = 'ios';
  const userAgent = navigator.userAgent;
  
  // Extract browser info from user agent
  let browserName = 'safari';
  let browserVersion = '0.0';
  
  const safariMatch = userAgent.match(/Version\/([0-9._]+).*Safari/);
  if (safariMatch) {
    browserVersion = safariMatch[1];
  }
  
  // Generate or retrieve device ID
  let deviceIdData = await browser.storage.local.get(['deviceId']);
  let deviceId;
  if (!deviceIdData.deviceId) {
    deviceId = 'ios_' + Math.random().toString(36).substring(2, 15);
    await browser.storage.local.set({ deviceId });
  } else {
    deviceId = deviceIdData.deviceId;
  }
  
  return {
    deviceId,
    platform,
    userAgent,
    browserName,
    browserVersion
  };
}

// Handle history updates
async function handleHistoryUpdate(details) {
  try {
    if (!details.url || details.url.startsWith('chrome://') || details.url.startsWith('safari://')) {
      return;
    }
    
    const deviceInfo = await getDeviceInfo();
    const visitId = `${deviceInfo.deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const historyEntry = {
      url: details.url,
      title: details.title || '',
      visitTime: Date.now(),
      visitId,
      referringVisitId: details.referringVisitId || '',
      transition: details.transitionType || 'link',
      deviceId: deviceInfo.deviceId,
      platform: deviceInfo.platform,
      userAgent: deviceInfo.userAgent,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion
    };
    
    await storageAdapter.addEntry(historyEntry);
    console.debug('Added history entry:', historyEntry.url);
    
    // Schedule a sync
    setTimeout(syncHistory, 5000);
  } catch (error) {
    console.error('Error handling history update:', error);
  }
}

// Handle messages from content scripts
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'summarizeContent') {
    try {
      // Forward the summarization request to native code
      // The native code will handle the actual summarization
      browser.runtime.sendNativeMessage({
        type: 'summarizeContent',
        url: message.url
      }, (response) => {
        if (response.error) {
          console.error('Native summarization failed:', response.error);
        } else {
          console.debug('Native summarization succeeded');
          
          // Notify the content script that summarization is complete
          if (sender.tab) {
            browser.tabs.sendMessage(sender.tab.id, {
              type: 'summarizationComplete',
              success: true
            }).catch(err => console.error('Error sending message to content script:', err));
          }
        }
      });
    } catch (error) {
      console.error('Error handling summarizeContent message:', error);
    }
  }
});

// Initialize extension and set up event listeners
async function init() {
  await initializeExtension();
  
  // Set up history listener
  browser.webNavigation.onCompleted.addListener(handleHistoryUpdate);
  
  // Set up periodic sync
  setInterval(syncHistory, SYNC_INTERVAL);
  
  // Do an initial sync
  setTimeout(syncHistory, 10000);
  
  console.log('ChronicleSync Safari extension initialized');
}

// Start the extension
init();