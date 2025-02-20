import { StorageService } from '../storage/StorageService';
import { SyncService } from '../sync/SyncService';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService();
const sync = new SyncService(storage, {
  serverUrl: process.env.SYNC_SERVER_URL,
});

let isInitialized = false;

async function initialize() {
  if (isInitialized) return;

  try {
    await storage.init();
    await sync.start();
    isInitialized = true;
    updateBadgeStatus('ok');
  } catch (error) {
    console.error('Failed to initialize:', error);
    updateBadgeStatus('error');
  }
}

function updateBadgeStatus(status: 'ok' | 'error' | 'syncing') {
  const colors = {
    ok: '#4CAF50',
    error: '#F44336',
    syncing: '#2196F3',
  };

  chrome.action.setBadgeBackgroundColor({ color: colors[status] });
  chrome.action.setBadgeText({ text: status === 'ok' ? '' : '!' });
}

// Listen for history items
chrome.history.onVisited.addListener(async (historyItem) => {
  if (!isInitialized) {
    await initialize();
  }

  try {
    const item = {
      id: uuidv4(),
      url: historyItem.url,
      title: historyItem.title || '',
      timestamp: Date.now(),
      lastModified: Date.now(),
      syncStatus: 'pending' as const,
    };

    await storage.addHistoryItem(item);
    updateBadgeStatus('syncing');
    await sync.sync();
    updateBadgeStatus('ok');
  } catch (error) {
    console.error('Failed to process history item:', error);
    updateBadgeStatus('error');
  }
});

// Listen for network status changes
window.addEventListener('online', () => {
  if (isInitialized) {
    sync.sync().catch(console.error);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_NOW') {
    updateBadgeStatus('syncing');
    sync.sync()
      .then(() => {
        updateBadgeStatus('ok');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Manual sync failed:', error);
        updateBadgeStatus('error');
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'GET_SYNC_STATUS') {
    sendResponse({
      isInitialized,
      badgeStatus: chrome.action.getBadgeText({}) || 'ok',
    });
    return false;
  }
});

// Initialize when the extension starts
initialize().catch(console.error);

// Cleanup when the extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  sync.stop();
});