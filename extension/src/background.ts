import { getConfig } from '../config.js';
import { HistoryStore } from './db/HistoryStore';
import { PageSummary } from './types';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Map to store page summaries
const pageSummaries = new Map<string, PageSummary>();

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

    // Initialize history store
    const historyStore = new HistoryStore();
    await historyStore.init();

    // Update device info
    await historyStore.updateDevice(systemInfo);

    // Get history since last sync
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000 // Increased limit for full sync
    });

    // Get detailed visit information for each history item
    const historyData = await Promise.all(historyItems.map(async item => {
      if (!item.url) {
        return [];
      }
      
      // Get all visits for this URL
      const visits = await chrome.history.getVisits({ url: item.url });
      
      // Filter visits within our time range and map them
      const visitData = visits
        .filter((visit) => {
          const visitTime = visit.visitTime || 0;
          return visitTime >= startTime && visitTime <= now;
        })
        .map((visit) => {
          // Get summary for this URL if available
          const summary = item.url ? pageSummaries.get(item.url) : undefined;
          
          return {
            url: item.url || '',
            title: item.title || '',
            visitTime: visit.visitTime || Date.now(),
            visitId: visit.visitId || '',
            referringVisitId: visit.referringVisitId || '',
            transition: visit.transition || '',
            ...systemInfo,
            summary
          };
        });

      return visitData;
    }));

    // Flatten the array of visit arrays
    const flattenedHistoryData = historyData.flat();
    
    // Store each history entry
    for (const entry of flattenedHistoryData) {
      await historyStore.addEntry(entry);
    }

    // Get all unsynced entries (including deleted ones)
    const unsyncedEntries = await historyStore.getUnsyncedEntries();

    if (unsyncedEntries.length > 0) {
      // Send unsynced entries to server
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

      // Parse response which contains remote entries
      const syncResponse = await response.json();

      // Merge remote entries into local store
      if (syncResponse.history && syncResponse.history.length > 0) {
        await historyStore.mergeRemoteEntries(syncResponse.history);
      }

      // Update device list
      if (syncResponse.devices) {
        for (const device of syncResponse.devices) {
          await historyStore.updateDevice(device);
        }
      }

      // Mark our entries as synced
      for (const entry of unsyncedEntries) {
        await historyStore.markAsSynced(entry.visitId);
      }

      // Update lastSync time
      const newLastSync = syncResponse.lastSyncTime || now;
      const lastSyncDate = new Date(newLastSync).toLocaleString();
      await chrome.storage.local.set({ lastSync: newLastSync });
      await chrome.storage.sync.set({ lastSync: lastSyncDate });

      try {
        // Notify UI about sync completion
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

    // eslint-disable-next-line no-console
    console.debug('Successfully completed sync');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error syncing history:', error);
    try {
      chrome.runtime.sendMessage({ 
        type: 'syncError',
        error: error instanceof Error ? error.message : String(error)
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }
    return;
  }
}

/**
 * Save a page summary to local storage
 * @param summary - The page summary to save
 */
async function saveSummary(summary: PageSummary): Promise<void> {
  try {
    // Add to in-memory map
    pageSummaries.set(summary.url, summary);
    
    // Save to Chrome storage
    const key = `summary_${btoa(summary.url).replace(/=/g, '')}`;
    await chrome.storage.local.set({ [key]: summary });
    
    console.log('Saved summary for:', summary.url);
  } catch (error) {
    console.error('Error saving summary:', error);
  }
}

/**
 * Load all summaries from Chrome storage
 */
async function loadSummaries(): Promise<void> {
  try {
    // Get all items from storage
    const items = await chrome.storage.local.get(null);
    
    // Filter for summary items
    for (const [key, value] of Object.entries(items)) {
      if (key.startsWith('summary_') && value) {
        const summary = value as PageSummary;
        pageSummaries.set(summary.url, summary);
      }
    }
    
    console.log(`Loaded ${pageSummaries.size} summaries from storage`);
  } catch (error) {
    console.error('Error loading summaries:', error);
  }
}

/**
 * Get a summary for a specific URL
 * @param url - The URL to get the summary for
 */
async function getSummary(url: string): Promise<PageSummary | null> {
  // Check in-memory cache first
  if (pageSummaries.has(url)) {
    return pageSummaries.get(url) || null;
  }
  
  try {
    // Try to load from storage
    const key = `summary_${btoa(url).replace(/=/g, '')}`;
    const result = await chrome.storage.local.get([key]);
    
    if (result[key]) {
      const summary = result[key] as PageSummary;
      // Add to in-memory cache
      pageSummaries.set(url, summary);
      return summary;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting summary:', error);
    return null;
  }
}

/**
 * Extract and summarize content from a webpage
 * @param url - The URL of the page
 * @param title - The title of the page
 * @param html - The HTML content of the page
 */
async function extractAndSummarize(url: string, title: string, html: string): Promise<void> {
  try {
    // Skip if we already have a summary for this URL
    const existingSummary = await getSummary(url);
    if (existingSummary) {
      console.log('Summary already exists for:', url);
      return;
    }
    
    // Create a DOM parser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Dynamically import the summarization service
    const { default: summarizationService } = await import('./services/SummarizationService');
    
    // Process the page
    const summary = await summarizationService.processPage(url, title, doc);
    
    if (summary) {
      // Save the summary
      await saveSummary(summary);
      
      // Notify that summarization is complete
      chrome.runtime.sendMessage({
        type: 'summarizationComplete',
        url,
        success: true
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    } else {
      console.warn('Failed to generate summary for:', url);
      
      // Notify that summarization failed
      chrome.runtime.sendMessage({
        type: 'summarizationComplete',
        url,
        success: false,
        error: 'Failed to generate summary'
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    }
  } catch (error) {
    console.error('Error in extractAndSummarize:', error);
    
    // Notify that summarization failed
    chrome.runtime.sendMessage({
      type: 'summarizationComplete',
      url,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }).catch(() => {
      // Ignore error when no receivers are present
    });
  }
}

// Initial sync with full history
syncHistory(true);

// Load existing summaries
loadSummaries();

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
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Manual sync failed:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      });
    return true; // Will respond asynchronously
  } else if (request.type === 'getHistory') {
    const { deviceId, since, limit } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const entries = await historyStore.getEntries(deviceId, since);
        // Apply limit if specified
        const limitedEntries = limit ? entries.slice(0, limit) : entries;
        sendResponse(limitedEntries);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching history from IndexedDB:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'getDevices') {
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const devices = await historyStore.getDevices();
        sendResponse(devices);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching devices from IndexedDB:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'deleteHistory') {
    const { visitId } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        await historyStore.deleteEntry(visitId);
        // Trigger sync to propagate deletion
        await syncHistory(false);
        sendResponse({ success: true });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting history entry:', error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'extractAndSummarize') {
    const { url, title, html } = request;
    
    if (!url || !title || !html) {
      sendResponse({ 
        success: false, 
        error: 'Missing required parameters' 
      });
      return true;
    }
    
    // Process the page asynchronously
    extractAndSummarize(url, title, html)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error in extractAndSummarize handler:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
    
    return true; // Will respond asynchronously
  } else if (request.type === 'getSummary') {
    const { url } = request;
    
    if (!url) {
      sendResponse({ 
        success: false, 
        error: 'Missing URL parameter' 
      });
      return true;
    }
    
    // Get the summary for the URL
    getSummary(url)
      .then(summary => {
        sendResponse({ 
          success: !!summary, 
          summary 
        });
      })
      .catch(error => {
        console.error('Error getting summary:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
    
    return true; // Will respond asynchronously
  }
});