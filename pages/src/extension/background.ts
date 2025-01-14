// Import browser polyfill
importScripts('browser-polyfill.js');

// Configuration
const API_URL = 'https://api.chroniclesync.xyz';

let isInitialized = false;
let clientId: string | undefined = undefined;

// Helper function to handle storage operations
async function storageGet(keys: string[]): Promise<StorageData> {
  return browser.storage.local.get(keys) as Promise<StorageData>;
}

async function storageSet(items: StorageData): Promise<void> {
  return browser.storage.local.set(items);
}

// Initialize the extension
async function initialize(): Promise<void> {
  if (isInitialized) return;
  
  // Get or generate unique client ID
  const storage = await storageGet(['clientId', 'lastSync']);
  clientId = storage.clientId;
  if (!clientId) {
    clientId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await storageSet({ clientId });
  }

  const lastSync = storage.lastSync || Date.now() - (24 * 60 * 60 * 1000);

  // Initial sync
  await syncHistory(lastSync);
  
  // Set up periodic sync
  setInterval(async () => {
    await syncHistory(await getLastSync());
  }, 5 * 60 * 1000); // Sync every 5 minutes

  isInitialized = true;
}

interface RemoteData {
  history: HistoryItem[];
}

// Two-way sync with the backend
async function syncHistory(startTime: number): Promise<void> {
  try {
    if (!clientId) {
      throw new Error('Client ID not initialized');
    }

    // Get local history since last sync
    const historyItems = await browser.history.search({
      text: '',
      startTime,
      maxResults: 1000
    });

    // Get remote history
    const remoteData = await fetch(`${API_URL}?clientId=${clientId}`, {
      method: 'GET'
    }).then(r => r.json()).catch(() => ({ history: [] } as RemoteData));

    // Merge local and remote history
    const mergedHistory = new Map<string, HistoryItem>();

    // Add remote history first (older entries)
    if (remoteData.history) {
      for (const item of remoteData.history) {
        mergedHistory.set(item.url, item);
      }
    }

    // Add local history (newer entries)
    for (const item of historyItems) {
      mergedHistory.set(item.url, {
        url: item.url,
        title: item.title,
        lastVisitTime: item.lastVisitTime,
        visitCount: item.visitCount
      });
    }

    // Convert map to array
    const historyData = {
      history: [...mergedHistory.values()],
      lastSync: Date.now()
    };

    // Push merged history to backend
    await fetch(`${API_URL}?clientId=${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(historyData)
    });

    // Update local sync time
    await storageSet({ lastSync: Date.now() });

    // Add any new remote entries to local history
    for (const item of mergedHistory.values()) {
      try {
        await browser.history.addUrl({
          url: item.url,
          title: item.title
        });
      } catch (e) {
        console.warn('Could not add history item:', e);
      }
    }
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

async function getLastSync(): Promise<number> {
  const storage = await storageGet(['lastSync']);
  return storage.lastSync || 0;
}

// Set up event listeners
browser.history.onVisited.addListener(async () => {
  await syncHistory(await getLastSync());
});

// Initialize the extension
initialize();