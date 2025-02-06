import HistoryService from './src/historyService.js';

function logToBackground(message) { console.debug(message); }

let historyService = null;

async function initHistoryService() {
  const result = await chrome.storage.sync.get(['clientId', 'apiUrl']);
  if (result.clientId && result.apiUrl) {
    historyService = new HistoryService(result.apiUrl, result.clientId);
  }
}

// Sync history periodically (every hour)
async function syncHistory() {
  try {
    if (!historyService) {
      await initHistoryService();
    }
    if (historyService) {
      await historyService.syncHistory();
      logToBackground('History synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync history:', error);
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  logToBackground('Extension installed');
  initHistoryService();
  // Initial sync
  syncHistory();
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.clientId || changes.apiUrl) {
    initHistoryService();
  }
});

// Set up periodic sync
setInterval(syncHistory, 60 * 60 * 1000); // Every hour