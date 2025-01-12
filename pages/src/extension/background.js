// Configuration
const API_URL = (() => {
  // For extensions, we'll use the production API by default
  // and allow configuration through extension options later
  return 'https://api.chroniclesync.xyz';
})();

let isInitialized = false;
let clientId = null;

// Initialize the extension
async function initialize() {
  if (isInitialized) return;
  
  // Get or generate unique client ID
  const storage = await chrome.storage.local.get(['clientId', 'lastSync']);
  clientId = storage.clientId;
  if (!clientId) {
    clientId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ clientId });
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

// Two-way sync with the backend
async function syncHistory(startTime) {
  try {
    // Get local history since last sync
    const historyItems = await chrome.history.search({
      text: '',
      startTime,
      maxResults: 1000
    });

    // Get remote history
    const remoteData = await fetch(`${API_URL}?clientId=${clientId}`, {
      method: 'GET'
    }).then(r => r.json()).catch(() => ({ history: [] }));

    // Merge local and remote history
    const mergedHistory = new Map();

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
        visitTime: item.lastVisitTime,
        visitCount: item.visitCount
      });
    }

    // Convert map to array
    const historyData = {
      history: Array.from(mergedHistory.values()),
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
    await chrome.storage.local.set({ lastSync: Date.now() });

    // Add any new remote entries to local history
    for (const item of mergedHistory.values()) {
      try {
        await chrome.history.addUrl({
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

async function getLastSync() {
  const storage = await chrome.storage.local.get(['lastSync']);
  return storage.lastSync || 0;
}

// Listen for new history items and trigger sync
chrome.history.onVisited.addListener(async () => {
  await syncHistory(await getLastSync());
});

// Initialize when the extension loads
initialize();