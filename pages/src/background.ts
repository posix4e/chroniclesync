// Default configuration
const DEFAULT_CONFIG = {
  retentionDays: 30,
  apiEndpoint: 'https://api.chroniclesync.xyz',
  syncIntervalMinutes: 30
};

// Initialize configuration
async function initConfig() {
  const config = await chrome.storage.sync.get(['config']);
  if (!config.config) {
    await chrome.storage.sync.set({ config: DEFAULT_CONFIG });
  }
  return config.config || DEFAULT_CONFIG;
}

// Initialize IndexedDB for history storage
const dbName = 'chronicleSync';
const dbVersion = 1;
let db: IDBDatabase;

const initDb = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      store.createIndex('urlTime', ['url', 'timestamp'], { unique: true });
      store.createIndex('timestamp', 'timestamp');
    };
  });
};

// Store history entry
async function storeHistoryEntry(url: string, title: string, timestamp: number) {
  const entry = { url, title, timestamp };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const index = store.index('urlTime');
    
    // Check for duplicates
    const query = index.get([url, timestamp]);
    
    query.onsuccess = () => {
      if (!query.result) {
        // No duplicate found, add the entry
        const request = store.add(entry);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        resolve(null); // Entry already exists
      }
    };
    
    query.onerror = () => reject(query.error);
  });
}

// Sync history with server
async function syncHistory() {
  const config = await initConfig();
  const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
  
  // Get entries that need syncing
  const transaction = db.transaction(['history'], 'readonly');
  const store = transaction.objectStore('history');
  const index = store.index('timestamp');
  const entries = await new Promise<any[]>((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.lowerBound(cutoffTime));
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  
  if (entries.length > 0) {
    try {
      const response = await fetch(`${config.apiEndpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

// Initialize and set up listeners
async function initialize() {
  try {
    console.log('Initializing ChronicleSync service worker...');
    await initDb();
    console.log('IndexedDB initialized successfully');
    
    const config = await initConfig();
    console.log('Configuration loaded:', config);
    
    // Set up periodic sync
    chrome.alarms.create('syncHistory', {
      periodInMinutes: config.syncIntervalMinutes
    });
    console.log('Alarm created for periodic sync');
    
    // Log successful initialization
    console.log('ChronicleSync service worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ChronicleSync service worker:', error);
    throw error;
  }
}

// Listen for history updates
chrome.history.onVisited.addListener(async (result) => {
  if (result.url && result.lastVisitTime) {
    await storeHistoryEntry(result.url, result.title || '', new Date(result.lastVisitTime).getTime());
  }
});

// Listen for sync alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncHistory') {
    syncHistory();
  }
});

// Listen for tab updates (for real-time tracking)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    storeHistoryEntry(changeInfo.url, tab.title || '', Date.now());
  }
});

// Add message listener for debugging and testing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  if (message.type === 'getStatus') {
    sendResponse({
      initialized: db !== undefined,
      serviceWorkerActive: true,
      timestamp: Date.now()
    });
    return true;
  }
});

// Initialize when extension loads
initialize().catch(error => {
  console.error('Failed to initialize:', error);
});