interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  favicon?: string;
  visitCount: number;
  lastVisitTime: number;
}

interface SyncedData {
  history?: { [url: string]: HistoryEntry };
}

// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed
});

// Track connected clients
const connectedClients = new Set<string>();

// Get the worker URL based on environment
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.chroniclesync.xyz'
  : 'https://api-staging.chroniclesync.xyz';

// Keep track of our synced history
let syncedHistory: { [url: string]: HistoryEntry } = {};

// Function to sync with the worker
async function syncWithWorker() {
  try {
    // Get current data from worker
    const response = await fetch(`${API_URL}?clientId=${chrome.runtime.id}`);
    if (response.ok) {
      const data = await response.json() as SyncedData;
      if (data.history) {
        syncedHistory = data.history;
      }
    }
  } catch {
    // Failed to sync with worker
  }
}

// Listen for history changes
chrome.history.onVisited.addListener(async (result) => {
  // Get the favicon URL
  let faviconUrl: string | undefined;
  try {
    const domain = new URL(result.url).origin;
    faviconUrl = `${domain}/favicon.ico`;
  } catch {
    // Failed to get favicon URL
  }

  // Update our synced history
  syncedHistory[result.url] = {
    url: result.url,
    title: result.title || '',
    timestamp: Date.now(),
    favicon: faviconUrl,
    visitCount: (syncedHistory[result.url]?.visitCount || 0) + 1,
    lastVisitTime: Date.now()
  };

  // Send to worker using existing API
  try {
    const response = await fetch(`${API_URL}?clientId=${chrome.runtime.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: syncedHistory
      })
    });

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to sync history with worker:', error);
  }

  // Broadcast to connected clients
  Array.from(connectedClients).forEach(clientId => {
    try {
      chrome.runtime.sendMessage(clientId, {
        type: 'HISTORY_UPDATED',
        data: syncedHistory[result.url]
      });
    } catch (error) {
      console.error(`Failed to send history update to client ${clientId}:`, error);
      connectedClients.delete(clientId);
    }
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id) return;

  switch (message.type) {
  case 'CONNECT_CLIENT':
    connectedClients.add(sender.id);
    // Initial sync when client connects
    syncWithWorker().then(() => sendResponse({ success: true }));
    return true;

  case 'DISCONNECT_CLIENT':
    connectedClients.delete(sender.id);
    sendResponse({ success: true });
    break;

  case 'GET_HISTORY':
    // Get history from both local browser and synced data
    Promise.all([
      // Get local browser history
      new Promise((resolve) => {
        chrome.history.search({ text: '', maxResults: 100 }, (results) => {
          resolve(results.map(result => ({
            url: result.url,
            title: result.title || '',
            timestamp: result.lastVisitTime,
            visitCount: 1,
            lastVisitTime: result.lastVisitTime
          })));
        });
      }),
      // Get synced history
      syncWithWorker()
    ]).then(([localHistory]) => {
      // Merge local history with synced history
      localHistory.forEach((entry: HistoryEntry) => {
        if (!syncedHistory[entry.url] || entry.lastVisitTime > syncedHistory[entry.url].lastVisitTime) {
          syncedHistory[entry.url] = entry;
        }
      });
      sendResponse(Object.values(syncedHistory));
    }).catch(error => {
      console.error('Failed to get history:', error);
      sendResponse([]);
    });
    return true;

  case 'DELETE_HISTORY':
    // Delete from both local browser and synced data
    Promise.all([
      // Delete from local browser
      new Promise((resolve) => {
        chrome.history.deleteUrl({ url: message.url }, () => resolve(true));
      }),
      // Delete from synced data
      (async () => {
        delete syncedHistory[message.url];
        await fetch(`${API_URL}?clientId=${chrome.runtime.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            history: syncedHistory
          })
        });
      })()
    ]).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Failed to delete history:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;

  case 'CLEAR_HISTORY':
    // Clear from both local browser and synced data
    Promise.all([
      // Clear local browser history
      new Promise((resolve) => {
        chrome.history.deleteAll(() => resolve(true));
      }),
      // Clear synced data
      (async () => {
        syncedHistory = {};
        await fetch(`${API_URL}?clientId=${chrome.runtime.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            history: syncedHistory
          })
        });
      })()
    ]).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Failed to clear history:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});