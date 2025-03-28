import { syncHistory } from './history-sync';
import { setupMessageListeners } from './message-handler';

// Sync interval in milliseconds (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;

/**
 * Initializes the background script
 */
export function initializeBackgroundScript(): void {
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

  // Set up message listeners
  setupMessageListeners();
}