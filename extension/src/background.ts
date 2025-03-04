import { getConfig } from './config';
import { HistoryStore } from './db/HistoryStore';
import { getSystemInfo } from './utils/system';
import { HistoryEntry, DeviceInfo } from './types';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function initializeExtension(): Promise<boolean> {
  try {
    await chrome.storage.local.get(['initialized']);
    await getConfig();
    await chrome.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

async function syncHistory(forceFullSync = false): Promise<void> {
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

    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const startTime = forceFullSync ? 0 : storedLastSync;

    const historyStore = new HistoryStore();
    await historyStore.init();

    await historyStore.updateDevice(systemInfo);

    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000
    });

    const historyData = await Promise.all(historyItems.map(async item => {
      const visits = await chrome.history.getVisits({ url: item.url });
      
      return visits
        .filter(visit => visit.visitTime >= startTime && visit.visitTime <= now)
        .map(visit => ({
          url: item.url,
          title: item.title || '',
          visitTime: visit.visitTime,
          visitId: visit.visitId.toString(),
          referringVisitId: visit.referringVisitId?.toString() || '0',
          transition: visit.transition,
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
      await chrome.storage.local.set({ lastSync: newLastSync });
      await chrome.storage.sync.set({ lastSync: lastSyncDate });

      try {
        chrome.runtime.sendMessage({ 
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
      chrome.runtime.sendMessage({ 
        type: 'syncError',
        error: error.message
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
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
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
    syncHistory(true)
      .then(() => {
        sendResponse({ success: true, message: 'Sync successful' });
      })
      .catch(error => {
        console.error('Manual sync failed:', error);
        sendResponse({ error: error.message });
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
        console.error('Error fetching history from IndexedDB:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'getDevices') {
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const devices = await historyStore.getDevices();
        sendResponse(devices);
      } catch (error) {
        console.error('Error fetching devices from IndexedDB:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error.message });
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
        console.error('Error deleting history entry:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error.message });
    });
    return true; // Will respond asynchronously
  }
});