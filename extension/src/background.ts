import { getConfig } from './configStore';

interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
  os: string;
}

let deviceId: string;
let clientId: string;

// Generate a unique device ID if not exists
async function initDeviceId() {
  const result = await chrome.storage.local.get('deviceId');
  if (!result.deviceId) {
    deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await chrome.storage.local.set({ deviceId });
  } else {
    deviceId = result.deviceId;
  }
}

// Get client ID from storage
async function getClientId(): Promise<string | null> {
  const result = await chrome.storage.local.get('clientId');
  return result.clientId || null;
}

// Sync history item to server
async function syncHistoryItem(item: chrome.history.HistoryItem) {
  const config = await getConfig();
  const clientId = await getClientId();
  
  if (!clientId) {
    console.warn('Client ID not set, skipping sync');
    return;
  }

  const historyItem: HistoryItem = {
    url: item.url || '',
    title: item.title || '',
    visitTime: item.lastVisitTime || Date.now(),
    deviceId,
    os: navigator.platform
  };

  try {
    const response = await fetch(`${config.apiEndpoint}/history/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(historyItem)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync history: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

// Initialize extension
async function init() {
  await initDeviceId();
  
  // Listen for history updates
  chrome.history.onVisited.addListener((result) => {
    syncHistoryItem(result);
  });

  // Sync recent history on startup
  const now = Date.now();
  const startTime = now - (7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  chrome.history.search({
    text: '',
    startTime,
    maxResults: 1000
  }, (results) => {
    results.forEach(syncHistoryItem);
  });
}

// Start the extension
init();