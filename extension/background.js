import { syncHistory } from './src/api';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastSyncTime = 0;

function logToBackground(message) { console.debug(message); }

async function getRecentHistory(startTime) {
  return new Promise((resolve) => {
    chrome.history.search({
      text: '',
      startTime,
      maxResults: 1000
    }, (historyItems) => {
      resolve(historyItems.map(item => ({
        url: item.url,
        title: item.title,
        visitTime: item.lastVisitTime
      })));
    });
  });
}

async function syncRecentHistory() {
  try {
    const currentTime = Date.now();
    const entries = await getRecentHistory(lastSyncTime);
    
    if (entries.length > 0) {
      const success = await syncHistory(entries);
      if (success) {
        lastSyncTime = currentTime;
        logToBackground(`Successfully synced ${entries.length} history entries`);
      }
    }
  } catch (error) {
    logToBackground(`Error syncing history: ${error}`);
  }
}

// Sync history periodically
setInterval(syncRecentHistory, SYNC_INTERVAL);

// Initial sync on extension load
syncRecentHistory();

// Listen for navigation events
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
    
    // Sync history when enough time has passed since last sync
    const currentTime = Date.now();
    if (currentTime - lastSyncTime >= SYNC_INTERVAL) {
      syncRecentHistory();
    }
  }
});