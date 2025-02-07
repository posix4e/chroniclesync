import { getClientId, syncHistory } from './src/historySync';

function logToBackground(message) { console.debug(message); }

// Sync history when a new URL is visited
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
    const clientId = await getClientId();
    if (clientId) {
      try {
        await syncHistory(clientId);
        logToBackground('History synced successfully');
      } catch (error) {
        logToBackground(`Error syncing history: ${error.message}`);
      }
    }
  }
});