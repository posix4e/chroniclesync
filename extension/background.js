import { HistoryService } from './src/services/history';
import { IndexedDBStore } from './src/storage/indexeddb';

// Initialize services
const store = new IndexedDBStore();
const historyService = new HistoryService(store);

// Sync history periodically
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastSyncTime = Date.now();

async function syncHistory() {
  try {
    await historyService.syncHistory(lastSyncTime);
    lastSyncTime = Date.now();
    console.log('History sync completed');
  } catch (error) {
    console.error('History sync failed:', error);
  }
}

// Initial sync
syncHistory();

// Set up periodic sync
setInterval(syncHistory, SYNC_INTERVAL);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('Navigation to:', changeInfo.url);
    // Trigger immediate sync when navigating to new pages
    syncHistory();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_HISTORY') {
    historyService.getHistory()
      .then(history => sendResponse({ history }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'DELETE_HISTORY_ITEM') {
    historyService.deleteHistoryItem(request.id)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.type === 'CLEAR_HISTORY') {
    historyService.clearHistory()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});