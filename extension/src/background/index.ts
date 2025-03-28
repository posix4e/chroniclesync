/**
 * Background script entry point
 * - Initializes sync scheduler
 * - Sets up message handlers
 * - Listens for navigation events
 */

import { initSyncScheduler, syncHistory } from './sync';
import { setupMessageHandlers } from './messages';

// Initialize components
initSyncScheduler();
setupMessageHandlers();

// Listen for navigation events
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    // Trigger sync after navigation
    setTimeout(() => syncHistory(false), 1000);
  }
});