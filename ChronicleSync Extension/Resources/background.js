// Safari Extension Background Script

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Configuration
let config = {
  apiEndpoint: "https://api.chroniclesync.xyz",
  clientId: "safari-extension-default"
};

// Load configuration from storage
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiEndpoint', 'clientId'], (result) => {
      if (result.apiEndpoint) {
        config.apiEndpoint = result.apiEndpoint;
      }
      if (result.clientId) {
        config.clientId = result.clientId;
      }
      resolve(config);
    });
  });
}

// Get system information
async function getSystemInfo() {
  return {
    deviceId: await getDeviceId(),
    deviceName: "Safari iOS",
    deviceType: "mobile",
    browser: "Safari",
    os: "iOS"
  };
}

// Generate or retrieve device ID
async function getDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['deviceId'], (result) => {
      if (result.deviceId) {
        resolve(result.deviceId);
      } else {
        const newDeviceId = 'safari-' + Math.random().toString(36).substring(2, 15);
        chrome.storage.local.set({ deviceId: newDeviceId });
        resolve(newDeviceId);
      }
    });
  });
}

// Initialize extension
async function initializeExtension() {
  try {
    await loadConfig();
    chrome.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

// Sync history with server
async function syncHistory(forceFullSync = false) {
  try {
    // Check if extension is initialized
    chrome.storage.local.get(['initialized'], async (result) => {
      if (!result.initialized) {
        const success = await initializeExtension();
        if (!success) {
          console.debug('Sync skipped: Extension not initialized');
          return;
        }
      }
      
      await loadConfig();
      
      if (!config.clientId || config.clientId === 'safari-extension-default') {
        console.debug('Sync paused: No client ID configured');
        return;
      }
      
      console.debug('Starting sync with client ID:', config.clientId);
      
      const systemInfo = await getSystemInfo();
      const now = Date.now();
      
      // Get last sync time
      chrome.storage.local.get(['lastSync'], async (stored) => {
        const storedLastSync = stored.lastSync || 0;
        const startTime = forceFullSync ? 0 : storedLastSync;
        
        // Get history items
        chrome.history.search({
          text: '',
          startTime: startTime,
          endTime: now,
          maxResults: 1000
        }, async (historyItems) => {
          // Process history items
          const historyData = [];
          
          for (const item of historyItems) {
            if (!item.url) continue;
            
            chrome.history.getVisits({ url: item.url }, (visits) => {
              const filteredVisits = visits.filter(visit => {
                const visitTime = visit.visitTime || 0;
                return visitTime >= startTime && visitTime <= now;
              });
              
              for (const visit of filteredVisits) {
                historyData.push({
                  url: item.url,
                  title: item.title || '',
                  visitTime: visit.visitTime || Date.now(),
                  visitId: visit.visitId.toString(),
                  referringVisitId: visit.referringVisitId?.toString() || '0',
                  transition: visit.transition || 'link',
                  ...systemInfo
                });
              }
            });
          }
          
          // Send data to server
          if (historyData.length > 0) {
            try {
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
              chrome.storage.local.set({ lastSync: newLastSync });
              chrome.storage.sync.set({ lastSync: lastSyncDate });
              
              // Notify UI of sync completion
              try {
                chrome.runtime.sendMessage({ 
                  type: 'syncComplete',
                  stats: {
                    sent: historyData.length,
                    received: syncResponse.history?.length || 0,
                    devices: syncResponse.devices?.length || 0
                  }
                });
              } catch (e) {
                // Ignore messaging errors
              }
              
              console.debug('Successfully completed sync');
            } catch (error) {
              console.error('Error syncing with server:', error);
              
              // Notify UI of sync error
              try {
                chrome.runtime.sendMessage({ 
                  type: 'syncError',
                  error: error.message || 'Unknown error'
                });
              } catch (e) {
                // Ignore messaging errors
              }
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in sync process:', error);
  }
}

// Initial sync with full history
setTimeout(() => syncHistory(true), 5000);

// Set up periodic sync
setInterval(() => syncHistory(false), SYNC_INTERVAL);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
    loadConfig().then(config => {
      sendResponse({ 
        clientId: config.clientId === 'safari-extension-default' ? null : config.clientId 
      });
    });
    return true; // Will respond asynchronously
  } 
  else if (request.type === 'triggerSync') {
    syncHistory(true).then(() => {
      sendResponse({ success: true, message: 'Sync successful' });
    }).catch(error => {
      sendResponse({ error: error.message || 'Unknown error' });
    });
    return true; // Will respond asynchronously
  }
  else if (request.type === 'getHistory') {
    // Simplified history retrieval for Safari
    chrome.history.search({
      text: '',
      maxResults: 1000
    }, (historyItems) => {
      sendResponse(historyItems);
    });
    return true; // Will respond asynchronously
  }
});