// Initialize IndexedDB
const dbName = 'chroniclesync';
const dbVersion = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create history store with device info
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('url', 'url');
        historyStore.createIndex('timestamp', 'timestamp');
        historyStore.createIndex('deviceId', 'deviceId');
      }

      // Create devices store
      if (!db.objectStoreNames.contains('devices')) {
        const devicesStore = db.createObjectStore('devices', { keyPath: 'id' });
        devicesStore.createIndex('lastSync', 'lastSync');
      }
    };
  });
};

// Initialize DB when extension loads
let db;
initDB().then(database => {
  db = database;
}).catch(console.error);

// Track navigation history
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && db) {
    const transaction = db.transaction(['history'], 'readwrite');
    const historyStore = transaction.objectStore('history');

    // Get device ID from storage
    chrome.storage.local.get(['deviceId'], (result) => {
      const deviceId = result.deviceId || 'unknown';
      
      // Store history entry with device info
      historyStore.add({
        url: changeInfo.url,
        title: tab.title,
        timestamp: new Date().toISOString(),
        deviceId: deviceId,
        tabId: tabId
      });
    });
  }
});

// Listen for sync requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sync') {
    // Get all history entries
    const transaction = db.transaction(['history'], 'readonly');
    const historyStore = transaction.objectStore('history');
    const request = historyStore.getAll();

    request.onsuccess = () => {
      const history = request.result;
      // Send history to server (handled by popup)
      sendResponse({ success: true, history: history });
    };

    request.onerror = () => {
      sendResponse({ success: false, error: request.error });
    };

    return true; // Keep channel open for async response
  }
});