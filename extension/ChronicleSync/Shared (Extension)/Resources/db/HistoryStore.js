// IndexedDB storage for history entries
export class HistoryStore {
  constructor() {
    this.db = null;
    this.DB_NAME = 'ChronicleSync';
    this.DB_VERSION = 1;
  }
  
  async init() {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('Failed to open database');
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'visitId' });
          historyStore.createIndex('url', 'url', { unique: false });
          historyStore.createIndex('visitTime', 'visitTime', { unique: false });
          historyStore.createIndex('synced', 'synced', { unique: false });
        }
        
        // Create devices store
        if (!db.objectStoreNames.contains('devices')) {
          const devicesStore = db.createObjectStore('devices', { keyPath: 'deviceId' });
          devicesStore.createIndex('lastSeen', 'lastSeen', { unique: false });
        }
      };
    });
  }
  
  // Add a history entry
  async addEntry(entry) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      // Add synced: false to mark for syncing
      const entryWithSync = { ...entry, synced: false };
      
      const request = store.put(entryWithSync);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Get unsynced entries
  async getUnsyncedEntries() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('synced');
      
      const request = index.getAll(false);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Mark an entry as synced
  async markAsSynced(visitId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      const request = store.get(visitId);
      
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.synced = true;
          store.put(entry);
          resolve();
        } else {
          reject(new Error('Entry not found'));
        }
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Update device information
  async updateDevice(device) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['devices'], 'readwrite');
      const store = transaction.objectStore('devices');
      
      const request = store.put(device);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Get all devices
  async getDevices() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['devices'], 'readonly');
      const store = transaction.objectStore('devices');
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Get history entries
  async getEntries(deviceId, since = 0) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('visitTime');
      
      // Get entries since the specified time
      const range = IDBKeyRange.lowerBound(since);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        let entries = request.result;
        
        // Filter by device if specified
        if (deviceId) {
          entries = entries.filter(entry => entry.deviceId === deviceId);
        }
        
        // Sort by visit time, newest first
        entries.sort((a, b) => b.visitTime - a.visitTime);
        
        resolve(entries);
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Update page content
  async updatePageContent(url, { content, summary }) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const index = store.index('url');
      
      const request = index.getAll(url);
      
      request.onsuccess = () => {
        const entries = request.result;
        
        if (entries.length > 0) {
          // Update the most recent entry
          const mostRecent = entries.reduce((latest, entry) => {
            return entry.visitTime > latest.visitTime ? entry : latest;
          }, entries[0]);
          
          mostRecent.content = content;
          mostRecent.summary = summary;
          mostRecent.synced = false; // Mark for syncing
          
          store.put(mostRecent);
          resolve();
        } else {
          reject(new Error('No entries found for URL'));
        }
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Search content in history entries
  async searchContent(query) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries = request.result;
        const results = [];
        
        for (const entry of entries) {
          if (entry.content) {
            const content = entry.content.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (content.includes(queryLower)) {
              // Find all occurrences
              const matches = [];
              let startIndex = 0;
              
              let index;
              while ((index = content.indexOf(queryLower, startIndex)) !== -1) {
                
                // Get context around the match
                const contextStart = Math.max(0, index - 50);
                const contextEnd = Math.min(content.length, index + queryLower.length + 50);
                const context = entry.content.substring(contextStart, contextEnd);
                
                matches.push({
                  index,
                  context
                });
                
                startIndex = index + queryLower.length;
              }
              
              if (matches.length > 0) {
                results.push({
                  entry,
                  matches
                });
              }
            }
          }
        }
        
        resolve(results);
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Delete a history entry
  async deleteEntry(visitId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      const request = store.delete(visitId);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  // Merge entries from remote devices
  async mergeRemoteEntries(remoteEntries) {
    await this.init();
    
    const transaction = this.db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    for (const entry of remoteEntries) {
      // Mark as synced since it came from the server
      entry.synced = true;
      
      // Check if we already have this entry
      const request = store.get(entry.visitId);
      
      await new Promise((resolve) => {
        request.onsuccess = () => {
          const existingEntry = request.result;
          
          if (!existingEntry) {
            // New entry, add it
            store.add(entry);
          }
          
          resolve();
        };
        
        request.onerror = () => {
          // Error, but continue with next entry
          console.error('Error checking for existing entry:', entry.visitId);
          resolve();
        };
      });
    }
    
    return Promise.resolve();
  }
}