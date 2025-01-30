import { getConfig } from './config.js';

export async function syncHistory(config) {
  try {
    const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const historyItems = await chrome.history.search({
      text: '',
      startTime: oneWeekAgo,
      maxResults: 5000
    });

    const historyData = historyItems.map(item => ({
      url: item.url,
      title: item.title,
      visitCount: item.visitCount,
      lastVisitTime: item.lastVisitTime
    }));

    const response = await fetch(`${config.apiEndpoint}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId
      },
      body: JSON.stringify({
        type: 'history',
        data: historyData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    // Log error to extension's error reporting system
    chrome.runtime.sendMessage({
      type: 'error',
      message: `Error syncing history: ${error.message}`
    });
    return false;
  }
}

// Sync history every hour
async function setupHistorySync() {
  const config = await getConfig();
  await syncHistory(config);
  setInterval(async () => {
    const updatedConfig = await getConfig();
    await syncHistory(updatedConfig);
  }, 60 * 60 * 1000);
}

// Start history sync when extension loads
setupHistorySync();

// Listen for tab updates to track new history items
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    const config = await getConfig();
    await syncHistory(config);
  }
});