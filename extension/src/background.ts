import { getConfig } from '../config';
import { HistoryStore } from './db/HistoryStore';
import { getSystemInfo } from './utils/system';
import { HistoryEntry, DeviceInfo } from './types';
import { Summarizer } from './utils/summarizer';

interface SyncResponse {
  history?: HistoryEntry[];
  devices?: DeviceInfo[];
  lastSyncTime?: number;
}

interface SyncStats {
  sent: number;
  received: number;
  devices: number;
}

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
      if (!item.url) return [];
      const visits = await chrome.history.getVisits({ url: item.url });
      
      return visits
        .filter((visit: chrome.history.VisitItem) => {
          const visitTime = visit.visitTime || 0;
          return visitTime >= startTime && visitTime <= now;
        })
        .map((visit: chrome.history.VisitItem) => ({
          url: item.url!,
          title: item.title || '',
          visitTime: visit.visitTime || Date.now(),
          visitId: visit.visitId.toString(),
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

      const syncResponse: SyncResponse = await response.json();

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
          } as SyncStats
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
      chrome.runtime.sendMessage({ 
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
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('[ChronicleSync] Navigation detected:', changeInfo.url);
    setTimeout(() => syncHistory(false), 1000);

    // Wait for the page to load completely
    if (changeInfo.status === 'complete' && tab.url) {
      console.log('[ChronicleSync] Page loaded completely, starting summarization process...');
      try {
        // Get the page content
        console.log('[ChronicleSync] Extracting page content...');
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const article = document.querySelector('article');
            if (article) {
              console.log('[ChronicleSync] Found article content');
              return article.textContent;
            }
            
            const mainContent = document.querySelector('main');
            if (mainContent) {
              console.log('[ChronicleSync] Found main content');
              return mainContent.textContent;
            }
            
            console.log('[ChronicleSync] Using body content');
            return document.body.textContent;
          }
        });

        if (result) {
          // Clean and prepare the text
          const cleanText = result
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1000); // Take first 1000 characters for summary

          console.log('[ChronicleSync] Extracted text (first 100 chars):', cleanText.slice(0, 100) + '...');

          // Initialize summarizer and generate summary
          console.log('[ChronicleSync] Initializing summarizer...');
          const summarizer = await Summarizer.getInstance();
          console.log('[ChronicleSync] Generating summary...');
          const summary = await summarizer.summarize(cleanText);
          
          console.log('[ChronicleSync] Summary generated successfully:', summary);
        } else {
          console.log('[ChronicleSync] No content extracted from page');
        }
      } catch (error) {
        console.error('[ChronicleSync] Error in summarization process:', error);
      }
    }
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
  }
});