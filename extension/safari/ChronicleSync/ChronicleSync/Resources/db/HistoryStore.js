// IndexedDB storage for history entries

// Database configuration
const DB_NAME = 'chroniclesync';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const DEVICES_STORE = 'devices';

export class HistoryStore {
  constructor() {
    this.db = null;
  }
  
  // Initialize the database
  async init() {
    if (this.db) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening database:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create history store
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'visitId' });
          historyStore.createIndex('url', 'url', { unique: false });
          historyStore.createIndex('visitTime', 'visitTime', { unique: false });
          historyStore.createIndex('deviceId', 'deviceId', { unique: false });
          historyStore.createIndex('synced', 'synced', { unique: false });
        }
        
        // Create devices store
        if (!db.objectStoreNames.contains(DEVICES_STORE)) {
          const devicesStore = db.createObjectStore(DEVICES_STORE, { keyPath: 'deviceId' });
          devicesStore.createIndex('name', 'name', { unique: false });
          devicesStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }
  
  // Add a history entry
  async addEntry(entry) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      
      // Add synced flag (false by default)
      const entryWithSync = {
        ...entry,
        synced: false
      };
      
      const request = store.put(entryWithSync);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error adding history entry:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Get history entries
  async getEntries(deviceId = null, since = 0, limit = 1000) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      
      let request;
      
      if (deviceId) {
        // Get entries for a specific device
        const index = store.index('deviceId');
        request = index.openCursor(IDBKeyRange.only(deviceId));
      } else {
        // Get all entries
        request = store.openCursor();
      }
      
      const entries = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const entry = cursor.value;
          
          // Filter by time if needed
          if (entry.visitTime >= since) {
            entries.push(entry);
          }
          
          // Stop if we've reached the limit
          if (entries.length >= limit) {
            resolve(entries);
          } else {
            cursor.continue();
          }
        } else {
          // Sort by visit time (newest first)
          entries.sort((a, b) => b.visitTime - a.visitTime);
          resolve(entries);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error getting history entries:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Get unsynced entries
  async getUnsyncedEntries() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(false));
      
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
      
      request.onerror = (event) => {
        console.error('Error getting unsynced entries:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Mark an entry as synced
  async markAsSynced(visitId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.get(visitId);
      
      request.onsuccess = (event) => {
        const entry = event.target.result;
        
        if (entry) {
          entry.synced = true;
          const updateRequest = store.put(entry);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            console.error('Error marking entry as synced:', event.target.error);
            reject(event.target.error);
          };
        } else {
          resolve(); // Entry not found, nothing to do
        }
      };
      
      request.onerror = (event) => {
        console.error('Error getting entry to mark as synced:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Merge remote entries
  async mergeRemoteEntries(entries) {
    await this.init();
    
    for (const entry of entries) {
      await this.addEntry({
        ...entry,
        synced: true // Mark as already synced
      });
    }
  }
  
  // Update device information
  async updateDevice(device) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DEVICES_STORE], 'readwrite');
      const store = transaction.objectStore(DEVICES_STORE);
      
      const request = store.put(device);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error updating device:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Get all devices
  async getDevices() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DEVICES_STORE], 'readonly');
      const store = transaction.objectStore(DEVICES_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting devices:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Delete a history entry
  async deleteEntry(visitId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.delete(visitId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error deleting history entry:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Update page content for a URL
  async updatePageContent(url, { content, summary }) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const index = store.index('url');
      const request = index.openCursor(IDBKeyRange.only(url));
      
      let updated = false;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const entry = cursor.value;
          
          // Update content and summary
          entry.content = content || entry.content;
          entry.summary = summary || entry.summary;
          entry.synced = false; // Mark as needing sync
          
          const updateRequest = store.put(entry);
          
          updateRequest.onsuccess = () => {
            updated = true;
            cursor.continue();
          };
          
          updateRequest.onerror = (event) => {
            console.error('Error updating page content:', event.target.error);
            reject(event.target.error);
          };
        } else {
          resolve(updated);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error finding entries for URL:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Search content in history entries
  async searchContent(query) {
    if (!query) {
      return [];
    }
    
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.openCursor();
      
      const results = [];
      const lowerQuery = query.toLowerCase();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const entry = cursor.value;
          let matches = [];
          
          // Search in title
          if (entry.title && entry.title.toLowerCase().includes(lowerQuery)) {
            matches.push({
              field: 'title',
              text: entry.title,
              context: entry.title
            });
          }
          
          // Search in URL
          if (entry.url && entry.url.toLowerCase().includes(lowerQuery)) {
            matches.push({
              field: 'url',
              text: entry.url,
              context: entry.url
            });
          }
          
          // Search in content
          if (entry.content) {
            const lowerContent = entry.content.toLowerCase();
            let startIndex = 0;
            
            while (startIndex < lowerContent.length) {
              const foundIndex = lowerContent.indexOf(lowerQuery, startIndex);
              
              if (foundIndex === -1) {
                break;
              }
              
              // Get context around the match
              const contextStart = Math.max(0, foundIndex - 50);
              const contextEnd = Math.min(entry.content.length, foundIndex + query.length + 50);
              const matchText = entry.content.substring(foundIndex, foundIndex + query.length);
              const context = entry.content.substring(contextStart, contextEnd);
              
              matches.push({
                field: 'content',
                text: matchText,
                context: context
              });
              
              startIndex = foundIndex + query.length;
              
              // Limit to 5 matches per entry
              if (matches.length >= 5) {
                break;
              }
            }
          }
          
          // Add to results if there are matches
          if (matches.length > 0) {
            results.push({
              entry,
              matches
            });
          }
          
          cursor.continue();
        } else {
          // Sort by visit time (newest first)
          results.sort((a, b) => b.entry.visitTime - a.entry.visitTime);
          resolve(results);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error searching content:', event.target.error);
        reject(event.target.error);
      };
    });
  }
}