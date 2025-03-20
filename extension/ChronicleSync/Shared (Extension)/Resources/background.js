// Import required modules
import { getConfig } from './config.js';
import { HistoryStore } from './db/HistoryStore.js';
import { getSystemInfo } from './utils/system.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function initializeExtension() {
  try {
    const stored = await browser.storage.local.get(['initialized']);
    if (!stored.initialized) {
      await getConfig();
      await browser.storage.local.set({ initialized: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

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
      return;
    }

    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    const stored = await browser.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const _startTime = forceFullSync ? 0 : storedLastSync;

    const historyStore = new HistoryStore();
    await historyStore.init();

    await historyStore.updateDevice(systemInfo);

    // Safari doesn't have the same history API as Chrome
    // We'll need to use a different approach to get history items
    // For Safari iOS, we can only access history for the current tab
    
    // Get all tabs
    const tabs = await browser.tabs.query({});
    
    // Process current tab history
    for (const tab of tabs) {
      try {
        // We can only add the current page to history
        if (tab.url && !tab.url.startsWith('safari-extension://') && !tab.url.startsWith('about:')) {
          const entry = {
            url: tab.url,
            title: tab.title || '',
            visitTime: now,
            visitId: `safari-${now}-${Math.random().toString(36).substring(2, 9)}`,
            referringVisitId: '0',
            transition: 'link',
            ...systemInfo
          };
          
          await historyStore.addEntry(entry);
        }
      } catch (error) {
        console.error('Error processing tab history:', error);
      }
    }

    const unsyncedEntries = await historyStore.getUnsyncedEntries();

    if (unsyncedEntries.length > 0) {
      const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: unsyncedEntries,
          deviceInfo: systemInfo,
          lastSync: storedLastSync
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const syncResponse = await response.json();

      if (syncResponse.history && syncResponse.history.length > 0) {
        await historyStore.mergeRemoteEntries(syncResponse.history);
      }

      if (syncResponse.devices) {
        for (const device of syncResponse.devices) {
          await historyStore.updateDevice(device);
        }
      }

      for (const entry of unsyncedEntries) {
        await historyStore.markAsSynced(entry.visitId);
      }

      const newLastSync = syncResponse.lastSyncTime || now;
      await browser.storage.local.set({ lastSync: newLastSync });

      try {
        browser.runtime.sendMessage({ 
          type: 'syncComplete',
          stats: {
            sent: unsyncedEntries.length,
            received: syncResponse.history?.length || 0,
            devices: syncResponse.devices?.length || 0
          }
        }).catch(() => {
          // Ignore error when no receivers are present
        });
      } catch {
        // Catch any other messaging errors
      }
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

// Initialize extension
initializeExtension().then(() => {
  // Initial sync
  syncHistory(true);
  
  // Set up periodic sync
  setInterval(() => syncHistory(false), SYNC_INTERVAL);
});

// Listen for tab updates
browser.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages
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
    const { deviceId, since, limit } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const entries = await historyStore.getEntries(deviceId, since);
        const limitedEntries = limit ? entries.slice(0, limit) : entries;
        sendResponse(limitedEntries);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching history from IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      }
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing IndexedDB:', errorMessage);
      sendResponse({ error: errorMessage });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'getDevices') {
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const devices = await historyStore.getDevices();
        sendResponse(devices);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching devices from IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      }
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing IndexedDB:', errorMessage);
      sendResponse({ error: errorMessage });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'deleteHistory') {
    const { visitId } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        await historyStore.deleteEntry(visitId);
        await syncHistory(false);
        sendResponse({ success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error deleting history entry:', errorMessage);
        sendResponse({ error: errorMessage });
      }
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing IndexedDB:', errorMessage);
      sendResponse({ error: errorMessage });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'pageContentExtracted') {
    // Handle page content extraction from content script
    const { url, content, summary } = request.data;
    if (url && (content || summary)) {
      const historyStore = new HistoryStore();
      historyStore.init().then(async () => {
        try {
          await historyStore.updatePageContent(url, { content, summary });
          console.debug('Updated page content for:', url);
          sendResponse({ success: true });
          
          // Trigger a sync to send the updated content to the server
          setTimeout(() => syncHistory(false), 1000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error updating page content:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      });
      return true; // Will respond asynchronously
    }
  } else if (request.type === 'searchHistory') {
    const { query } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const results = await historyStore.searchContent(query);
        
        // Format the results for display
        const formattedResults = results.map(result => ({
          visitId: result.entry.visitId,
          url: result.entry.url,
          title: result.entry.title,
          visitTime: result.entry.visitTime,
          matches: result.matches
        }));
        
        sendResponse({ success: true, results: formattedResults });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error searching history:', errorMessage);
        sendResponse({ error: errorMessage });
      }
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error initializing IndexedDB:', errorMessage);
      sendResponse({ error: errorMessage });
    });
    return true; // Will respond asynchronously
  }
});
