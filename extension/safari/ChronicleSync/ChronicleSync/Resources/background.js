// Safari-compatible background script
import { getConfig } from './config.js';
import { HistoryStore } from './db/HistoryStore.js';
import { getSystemInfo } from './utils/system.js';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

async function initializeExtension() {
  try {
    await browserAPI.storage.local.get(['initialized']);
    await getConfig();
    await browserAPI.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

async function syncHistory(forceFullSync = false) {
  try {
    const initialized = await browserAPI.storage.local.get(['initialized']);
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

    const stored = await browserAPI.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const startTime = forceFullSync ? 0 : storedLastSync;

    const historyStore = new HistoryStore();
    await historyStore.init();

    await historyStore.updateDevice(systemInfo);

    // Safari history API is different, so we need to handle it differently
    let historyItems = [];
    
    if (isSafari) {
      // Safari-specific history implementation
      try {
        historyItems = await browserAPI.history.search({
          text: '',
          startTime: startTime,
          endTime: now,
          maxResults: 10000
        });
      } catch (error) {
        console.error('Safari history API error:', error);
        // If history API fails, we'll continue with an empty array
      }
    } else {
      // Chrome history implementation
      historyItems = await browserAPI.history.search({
        text: '',
        startTime: startTime,
        endTime: now,
        maxResults: 10000
      });
    }

    const historyData = await Promise.all(historyItems.map(async item => {
      if (!item.url) return [];
      
      let visits = [];
      try {
        visits = await browserAPI.history.getVisits({ url: item.url });
      } catch (error) {
        console.error('Error getting visits for URL:', item.url, error);
        // If we can't get visits, create a single visit entry with current data
        return [{
          url: item.url,
          title: item.title || '',
          visitTime: item.lastVisitTime || Date.now(),
          visitId: Date.now().toString(),
          referringVisitId: '0',
          transition: 'link',
          ...systemInfo
        }];
      }
      
      return visits
        .filter((visit) => {
          const visitTime = visit.visitTime || 0;
          return visitTime >= startTime && visitTime <= now;
        })
        .map((visit) => ({
          url: item.url,
          title: item.title || '',
          visitTime: visit.visitTime || Date.now(),
          visitId: visit.visitId?.toString() || Date.now().toString(),
          referringVisitId: visit.referringVisitId?.toString() || '0',
          transition: visit.transition || 'link',
          ...systemInfo
        }));
    }));

    const flattenedHistoryData = historyData.flat();
    
    for (const entry of flattenedHistoryData) {
      await historyStore.addEntry(entry);
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
      const lastSyncDate = new Date(newLastSync).toLocaleString();
      await browserAPI.storage.local.set({ lastSync: newLastSync });
      
      try {
        await browserAPI.storage.sync.set({ lastSync: lastSyncDate });
      } catch (error) {
        console.warn('Could not save to sync storage:', error);
        // Continue even if sync storage fails
      }

      try {
        browserAPI.runtime.sendMessage({ 
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
      browserAPI.runtime.sendMessage({ 
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
setInterval(() => syncHistory(false), SYNC_INTERVAL);

// Listen for navigation events
browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
    browserAPI.storage.local.get(['initialized']).then(async result => {
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
  } else if (request.type === 'checkSettings') {
    // Safari-specific: Check if settings are configured
    browserAPI.storage.local.get(['initialized']).then(async result => {
      if (!result.initialized) {
        sendResponse({ configured: false });
        return;
      }
      
      try {
        const config = await getConfig();
        const isConfigured = config.clientId && config.clientId !== 'extension-default';
        sendResponse({ configured: isConfigured });
      } catch (error) {
        sendResponse({ configured: false, error: String(error) });
      }
    });
    return true; // Will respond asynchronously
  }
});