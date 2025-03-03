import { getConfig } from './config.js';
import { HistoryStore } from './src/db/HistoryStore';
import { SummarizationService } from './src/services/SummarizationService';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Store for page summaries
const pageSummaries = new Map();

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
      // Get all visits for this URL
      const visits = await chrome.history.getVisits({ url: item.url });
      
      // Filter visits within our time range and map them
      const visitData = visits
        .filter(visit => visit.visitTime >= startTime && visit.visitTime <= now)
        .map(visit => {
          // Check if we have a summary for this URL
          const summary = item.url ? pageSummaries.get(item.url)?.summary : undefined;
          
          return {
            url: item.url,
            title: item.title,
            visitTime: visit.visitTime,
            visitId: visit.visitId,
            referringVisitId: visit.referringVisitId,
            transition: visit.transition,
            summary: summary, // Add summary if available
            ...systemInfo
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
        error: error.message
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
 * Save a page summary to storage
 */
async function saveSummary(summary) {
  try {
    // Add to in-memory map
    pageSummaries.set(summary.url, summary);
    
    // Save to storage
    const summaries = await chrome.storage.local.get(['pageSummaries']);
    const storedSummaries = summaries.pageSummaries || {};
    
    // Update with new summary
    storedSummaries[summary.url] = summary;
    
    // Save back to storage
    await chrome.storage.local.set({ pageSummaries: storedSummaries });
    
    console.debug('Summary saved for:', summary.url);
  } catch (error) {
    console.error('Error saving summary:', error);
  }
}

/**
 * Load all summaries from storage
 */
async function loadSummaries() {
  try {
    const summaries = await chrome.storage.local.get(['pageSummaries']);
    const storedSummaries = summaries.pageSummaries || {};
    
    // Clear existing map
    pageSummaries.clear();
    
    // Add all stored summaries to map
    Object.values(storedSummaries).forEach((summary) => {
      if (summary && typeof summary === 'object' && summary.url) {
        pageSummaries.set(summary.url, summary);
      }
    });
    
    console.debug(`Loaded ${pageSummaries.size} page summaries from storage`);
  } catch (error) {
    console.error('Error loading summaries:', error);
  }
}

/**
 * Process content for summarization
 */
async function processContentForSummarization(request) {
  try {
    // Validate request
    if (!request || !request.url) {
      console.error('Invalid summarization request');
      return;
    }
    
    // Skip if we already have a summary for this URL
    if (pageSummaries.has(request.url)) {
      console.debug('Summary already exists for:', request.url);
      return;
    }
    
    // Skip if content is too short
    if (!request.content || request.content.length < 100) {
      console.debug('Content too short to summarize:', request.url);
      return;
    }
    
    console.debug('Processing content for summarization:', request.url);
    
    // Create page content object
    const pageContent = {
      url: request.url,
      title: request.title || 'Untitled Page',
      content: request.content,
      timestamp: Date.now()
    };
    
    // Get the summarization service
    const summarizationService = SummarizationService.getInstance();
    
    // Process the page with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Summarization timed out')), 30000);
    });
    
    let summary;
    try {
      summary = await Promise.race([
        summarizationService.processPage(pageContent),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn('Error in processPage, using fallback summary:', error);
      
      // Create a simple fallback summary
      const firstParagraph = request.content.split('\n\n')[0] || request.content.substring(0, 200);
      summary = {
        url: request.url,
        title: request.title || 'Untitled Page',
        summary: firstParagraph.length > 150 ? firstParagraph.substring(0, 150) + '...' : firstParagraph,
        timestamp: Date.now(),
        contentLength: request.content.length
      };
    }
    
    // Save the summary
    await saveSummary(summary);
    
    // Notify the content script
    try {
      // Find the tab with this URL
      const tabs = await chrome.tabs.query({ url: request.url });
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'summarizationComplete',
          url: request.url,
          summary: summary.summary,
          success: true
        }).catch(err => {
          console.debug('Error sending message to content script (tab may be closed):', err);
        });
      }
    } catch (error) {
      console.error('Error sending summarization result to content script:', error);
    }
  } catch (error) {
    console.error('Error processing content for summarization:', error);
    
    // Notify content script of error
    try {
      const tabs = await chrome.tabs.query({ url: request.url });
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'summarizationComplete',
          url: request.url,
          summary: '',
          success: false,
          error: error.message
        }).catch(() => {
          // Ignore error if tab is closed
        });
      }
    } catch {
      // Ignore error
    }
  }
}

// Initial setup
(async () => {
  // Load existing summaries
  await loadSummaries();
  
  // Initial sync with full history
  syncHistory(true);
})();

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
        sendResponse({ error: error.message });
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
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Error fetching devices from IndexedDB:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
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
        // Trigger sync to propagate deletion
        await syncHistory(false);
        sendResponse({ success: true });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting history entry:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error initializing IndexedDB:', error);
      sendResponse({ error: error.message });
    });
    return true; // Will respond asynchronously
  } else if (request.type === 'summarizeContent') {
    // Process content for summarization
    processContentForSummarization(request)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error processing content:', error);
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (request.type === 'getSummary') {
    // Get summary for a URL
    const { url } = request;
    const summary = pageSummaries.get(url);
    sendResponse({ summary: summary || null });
    return false; // Synchronous response
  } else if (request.type === 'getAllSummaries') {
    // Get all summaries
    sendResponse({ summaries: Array.from(pageSummaries.values()) });
    return false; // Synchronous response
  }
});