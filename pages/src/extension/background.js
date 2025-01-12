// Configuration
const API_URL = 'https://api.chroniclesync.xyz';

let isInitialized = false;
let clientId = null;

// Helper function to detect browser type
function getBrowser() {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  if (typeof window !== 'undefined' && window.safari) return window.safari;
  throw new Error('Unsupported browser');
}

// Helper function to handle storage operations
async function storageGet(keys) {
  const browser = getBrowser();
  if (browser === window.safari) {
    return new Promise((resolve) => {
      const result = {};
      keys.forEach(key => {
        result[key] = localStorage.getItem(key);
      });
      resolve(result);
    });
  }
  return browser.storage.local.get(keys);
}

async function storageSet(items) {
  const browser = getBrowser();
  if (browser === window.safari) {
    return new Promise((resolve) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      resolve();
    });
  }
  return browser.storage.local.set(items);
}

// Initialize the extension
async function initialize() {
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

// Two-way sync with the backend
async function syncHistory(startTime) {
  try {
    const browser = getBrowser();
    
    // Get local history since last sync
    let historyItems = [];
    if (browser === window.safari) {
      // Safari doesn't have a direct history API, use alternative method
      // This is a placeholder - Safari extension will need to request history access
      historyItems = [];
    } else {
      historyItems = await browser.history.search({
        text: '',
        startTime,
        maxResults: 1000
      });
    }

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
    await storageSet({ lastSync: Date.now() });

    // Add any new remote entries to local history
    if (browser !== window.safari) {
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
    }
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

async function getLastSync() {
  const storage = await storageGet(['lastSync']);
  return storage.lastSync || 0;
}

// Set up event listeners based on browser type
const browser = getBrowser();
if (browser === window.safari) {
  // Safari-specific event handling
  window.addEventListener('load', () => {
    initialize();
  });
} else {
  // Chrome/Firefox event handling
  browser.history.onVisited.addListener(async () => {
    await syncHistory(await getLastSync());
  });
  initialize();
}