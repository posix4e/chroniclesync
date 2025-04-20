// Safari WebExtension background script
// This is a simplified version of the Chrome extension's background.ts

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const API_URL = 'https://api-staging.chroniclesync.xyz';

// History store for Safari
class HistoryStore {
  constructor() {
    this.dbName = 'chroniclesync-history';
    this.storeName = 'history';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.initialized = true;
          resolve();
        };
        
        request.onerror = (event) => {
          reject(new Error('Failed to open IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error initializing HistoryStore:', error);
      throw error;
    }
  }

  async addEntry(entry) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add history entry'));
    });
  }

  async getRecentEntries(limit = 100) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      const entries = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && entries.length < limit) {
          entries.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get history entries'));
    });
  }

  async getEntriesSince(timestamp) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.lowerBound(timestamp, true);
      const request = index.openCursor(range);
      const entries = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          entries.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get history entries'));
    });
  }
}

// Initialize the history store
const historyStore = new HistoryStore();

// Get system info for device identification
async function getSystemInfo() {
  const browserInfo = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(browserInfo);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  return {
    browser: isSafari ? 'Safari' : 'Unknown',
    os: isIOS ? 'iOS' : 'Unknown',
    deviceName: isIOS ? 'iOS Device' : 'Unknown Device',
    deviceId: await getOrCreateDeviceId()
  };
}

// Get or create a unique device ID
async function getOrCreateDeviceId() {
  const result = await browser.storage.local.get('deviceId');
  if (result.deviceId) {
    return result.deviceId;
  }
  
  const deviceId = 'safari-' + Math.random().toString(36).substring(2, 15);
  await browser.storage.local.set({ deviceId });
  return deviceId;
}

// Initialize the extension
async function initializeExtension() {
  try {
    const result = await browser.storage.local.get(['initialized']);
    if (!result.initialized) {
      await browser.storage.local.set({ initialized: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

// Sync history with the server
async function syncHistory() {
  try {
    const lastSyncTime = await getLastSyncTime();
    const newEntries = await historyStore.getEntriesSince(lastSyncTime);
    
    if (newEntries.length === 0) {
      console.log('No new entries to sync');
      return { sent: 0, received: 0, devices: 0 };
    }
    
    const deviceInfo = await getSystemInfo();
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      console.warn('No API key found, skipping sync');
      return { sent: 0, received: 0, devices: 0 };
    }
    
    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        device: deviceInfo,
        history: newEntries,
        lastSyncTime
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process received history entries
    if (data.history && Array.isArray(data.history)) {
      for (const entry of data.history) {
        await historyStore.addEntry(entry);
      }
    }
    
    // Update last sync time
    const now = Date.now();
    await browser.storage.local.set({ lastSyncTime: now });
    
    return {
      sent: newEntries.length,
      received: data.history ? data.history.length : 0,
      devices: data.devices ? data.devices.length : 0
    };
  } catch (error) {
    console.error('Error syncing history:', error);
    throw error;
  }
}

// Get the last sync time
async function getLastSyncTime() {
  const result = await browser.storage.local.get('lastSyncTime');
  return result.lastSyncTime || 0;
}

// Get the API key
async function getApiKey() {
  const result = await browser.storage.local.get('apiKey');
  return result.apiKey || null;
}

// Track browser history
function trackBrowserHistory() {
  browser.history.onVisited.addListener(async (historyItem) => {
    try {
      const entry = {
        url: historyItem.url,
        title: historyItem.title || '',
        timestamp: historyItem.lastVisitTime || Date.now(),
        visitCount: historyItem.visitCount || 1
      };
      
      await historyStore.addEntry(entry);
    } catch (error) {
      console.error('Error tracking history:', error);
    }
  });
}

// Set up periodic sync
function setupPeriodicSync() {
  setInterval(async () => {
    try {
      const stats = await syncHistory();
      console.log('Sync completed:', stats);
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }, SYNC_INTERVAL);
}

// Initialize the extension when installed
browser.runtime.onInstalled.addListener(async () => {
  await initializeExtension();
  trackBrowserHistory();
  setupPeriodicSync();
});

// Handle messages from content scripts or popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getHistory') {
    historyStore.getRecentEntries(message.limit || 100)
      .then(entries => sendResponse({ success: true, entries }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
  
  if (message.action === 'syncNow') {
    syncHistory()
      .then(stats => sendResponse({ success: true, stats }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'setApiKey') {
    browser.storage.local.set({ apiKey: message.apiKey })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Initialize on startup
initializeExtension()
  .then(() => {
    trackBrowserHistory();
    setupPeriodicSync();
    console.log('ChronicleSync Safari extension initialized');
  })
  .catch(error => {
    console.error('Failed to initialize ChronicleSync Safari extension:', error);
  });