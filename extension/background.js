import { getConfig } from './config.js';
import { HistoryStore } from './src/db/HistoryStore';
import { SummaryService } from './src/services/SummaryService';
import { DEFAULT_SUMMARY_SETTINGS } from './src/types/summary';

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

// Initial sync with full history
syncHistory(true);

// Set up periodic sync
setInterval(() => syncHistory(false), SYNC_INTERVAL);

// Initialize summary service
let summaryService = null;

async function initializeSummaryService() {
  const config = await getConfig();
  const settings = config.summarySettings || DEFAULT_SUMMARY_SETTINGS;
  summaryService = new SummaryService(settings);
}

// Listen for navigation events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.debug(`[Background] Navigation completed: ${tab.url}`);
    
    // Initialize summary service if needed
    if (!summaryService) {
      await initializeSummaryService();
    }

    try {
      console.log('[Background] Waiting for page to load:', {
        url: tab.url,
        title: tab.title,
        id: tabId
      });

      // Wait for a short time to ensure page is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture page content with priority settings
      const [{ result }] = await chrome.scripting.executeScript({
        world: 'MAIN',
        target: { tabId },
        injectImmediately: true,
        func: (settings) => {
          try {
            const elements = [];
            const selectors = {
              headlines: 'h1, h2, h3, .title, .story',
              lists: 'ul, ol',
              paragraphs: 'p, article, .article, .content, .main, .storylink, .comment, td.title > a, td.title > span.titleline > a',
              quotes: 'blockquote'
            };
            
            // Debug info
            console.log('[Content] Document ready state:', document.readyState);
            console.log('[Content] Page title:', document.title);
            
            // Function to safely extract text from elements
            const extractText = (selector, label) => {
              try {
                const elements = Array.from(document.querySelectorAll(selector));
                console.log(`[Content] Found ${label}:`, {
                  count: elements.length,
                  selectors: selector,
                  firstElement: elements[0]?.outerHTML
                });
                return elements
                  .map(el => el.textContent?.trim())
                  .filter(text => text && text.length > 0);
              } catch (error) {
                console.error(`[Content] Error extracting ${label}:`, error);
                return [];
              }
            };

            // Extract headlines
            if (settings.contentPriority.headlines) {
              const headlines = extractText(selectors.headlines, 'headlines');
              elements.push(...headlines);
            }

            // Extract lists
            if (settings.contentPriority.lists) {
              const lists = extractText(selectors.lists, 'lists');
              elements.push(...lists);
            }

            // Extract main content
            const mainContent = extractText(selectors.paragraphs, 'paragraphs');
            elements.push(...mainContent);

            // Extract quotes
            if (settings.contentPriority.quotes) {
              const quotes = extractText(selectors.quotes, 'quotes');
              elements.push(...quotes);
            }

            // If no content found, try to get all visible text
            if (elements.length === 0) {
              console.log('[Content] No content found with selectors, trying fallback');
              const allText = Array.from(document.body.getElementsByTagName('*'))
                .filter(el => {
                  const style = window.getComputedStyle(el);
                  return style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         el.textContent?.trim().length > 0;
                })
                .map(el => el.textContent?.trim())
                .filter(text => text && text.length > 0);
              elements.push(...allText);
            }

            // Log extraction results
            console.log('[Content] Total elements extracted:', elements.length);
            
            return { 
              elements,
              stats: {
                totalElements: elements.length,
                documentState: document.readyState,
                url: document.location.href
              }
            };
          } catch (error) {
            console.error('[Content] Error extracting content:', error);
            throw error;
          }
        },
        args: [summaryService.getSettings().contentPriority]
      });

      // Generate summary
      const summary = await summaryService.summarizeContent(tab.url, result);
      
      // Log the summary
      console.log('[Summary] Generated summary:', {
        url: tab.url,
        title: tab.title,
        content: summary.content,
        status: summary.status,
        version: summary.version,
        timestamp: new Date(summary.lastModified).toISOString()
      });
      
      // Store summary in history entry
      const historyStore = new HistoryStore();
      await historyStore.init();
      await historyStore.updateSummary(tab.url, summary);

      console.debug(`[Summary] Generated summary for ${tab.url}`);
    } catch (error) {
      console.error('[Summary] Error processing page:', error);
    }

    // Trigger sync after processing
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
  } else if (request.type === 'getSummary') {
    const { url } = request;
    const historyStore = new HistoryStore();
    historyStore.init().then(async () => {
      try {
        const summary = await historyStore.getSummary(url);
        sendResponse(summary);
      } catch (error) {
        console.error('[Summary] Error fetching summary:', error);
        sendResponse({ error: error.message });
      }
    }).catch(error => {
      console.error('[Summary] Error initializing IndexedDB:', error);
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
  }
});