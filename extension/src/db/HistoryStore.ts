import { HistoryEntry, DeviceInfo } from '../types';

export class HistoryStore {
  private readonly DB_NAME = 'chroniclesync';
  private readonly HISTORY_STORE = 'history';
  private readonly DEVICE_STORE = 'devices';
  private readonly DB_VERSION = 3;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Initializing IndexedDB...');
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('IndexedDB opened successfully');
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        // Create or update history store
        if (!db.objectStoreNames.contains(this.HISTORY_STORE)) {
          const store = db.createObjectStore(this.HISTORY_STORE, { keyPath: 'visitId' });
          store.createIndex('visitTime', 'visitTime');
          store.createIndex('syncStatus', 'syncStatus');
          store.createIndex('url', 'url');
          store.createIndex('deviceId', 'deviceId');
          store.createIndex('lastModified', 'lastModified');
          console.log('Created history store with indexes');
        } else if (oldVersion < 3) {
          // Add new indexes for version 3
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const store = transaction.objectStore(this.HISTORY_STORE);
            
            // Check if indexes already exist before creating them
            if (!store.indexNames.contains('pageSummary')) {
              store.createIndex('pageSummary', 'pageSummary');
            }
            
            if (!store.indexNames.contains('hasContent')) {
              store.createIndex('hasContent', 'pageContent', { multiEntry: false });
            }
            
            console.log('Added content-related indexes to history store');
          }
        }

        // Create or update devices store
        if (!db.objectStoreNames.contains(this.DEVICE_STORE)) {
          const deviceStore = db.createObjectStore(this.DEVICE_STORE, { keyPath: 'deviceId' });
          deviceStore.createIndex('lastSeen', 'lastSeen');
          console.log('Created devices store');
        }
      };
    });
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);

      const fullEntry: HistoryEntry = {
        ...entry,
        syncStatus: 'pending',
        lastModified: Date.now()
      };

      const request = store.put(fullEntry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(this.HISTORY_STORE);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markAsSynced(visitId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);
      const request = store.get(visitId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.syncStatus = 'synced';
          entry.lastModified = Date.now();
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]> {
    if (!this.db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      console.log('Getting history entries...');
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(this.HISTORY_STORE);
      
      let request: IDBRequest;
      if (deviceId) {
        const deviceIndex = store.index('deviceId');
        request = deviceIndex.getAll(deviceId);
      } else {
        const timeIndex = store.index('lastModified');
        request = timeIndex.getAll(since ? IDBKeyRange.lowerBound(since) : undefined);
      }

      request.onerror = () => {
        console.error('Error getting entries:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const entries = request.result || [];
        // Filter out deleted entries unless explicitly requested
        const filteredEntries = entries.filter((entry: HistoryEntry) => !entry.deleted);
        console.log('Retrieved entries:', filteredEntries.length);
        resolve(filteredEntries);
      };
    });
  }

  async mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);

      let completed = 0;
      let errors = 0;

      remoteEntries.forEach(remoteEntry => {
        // Get existing entry if any
        const request = store.get(remoteEntry.visitId);

        request.onerror = () => {
          errors++;
          if (completed + errors === remoteEntries.length) {
            if (errors > 0) {
              reject(new Error(`Failed to merge ${errors} entries`));
            } else {
              resolve();
            }
          }
        };

        request.onsuccess = () => {
          const localEntry = request.result;
          
          // If local entry exists, only update if remote is newer
          if (!localEntry || remoteEntry.lastModified > localEntry.lastModified) {
            const putRequest = store.put({
              ...remoteEntry,
              syncStatus: 'synced'
            });

            putRequest.onerror = () => {
              errors++;
              if (completed + errors === remoteEntries.length) {
                if (errors > 0) {
                  reject(new Error(`Failed to merge ${errors} entries`));
                } else {
                  resolve();
                }
              }
            };

            putRequest.onsuccess = () => {
              completed++;
              if (completed + errors === remoteEntries.length) {
                if (errors > 0) {
                  reject(new Error(`Failed to merge ${errors} entries`));
                } else {
                  resolve();
                }
              }
            };
          } else {
            completed++;
            if (completed + errors === remoteEntries.length) {
              if (errors > 0) {
                reject(new Error(`Failed to merge ${errors} entries`));
              } else {
                resolve();
              }
            }
          }
        };
      });
    });
  }

  async updateDevice(device: DeviceInfo): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.DEVICE_STORE], 'readwrite');
      const store = transaction.objectStore(this.DEVICE_STORE);

      const deviceWithTimestamp = {
        ...device,
        lastSeen: Date.now()
      };

      const request = store.put(deviceWithTimestamp);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getDevices(): Promise<DeviceInfo[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.DEVICE_STORE], 'readonly');
      const store = transaction.objectStore(this.DEVICE_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteEntry(visitId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);
      
      // Soft delete by marking as deleted
      const request = store.get(visitId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.deleted = true;
          entry.lastModified = Date.now();
          entry.syncStatus = 'pending';
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async updateEntryContent(visitId: string, pageContent: string, pageSummary: string, contentEmbedding?: number[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);
      
      const request = store.get(visitId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.pageContent = pageContent;
          entry.pageSummary = pageSummary;
          if (contentEmbedding) {
            entry.contentEmbedding = contentEmbedding;
          }
          entry.lastModified = Date.now();
          entry.syncStatus = 'pending';
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          reject(new Error(`Entry with visitId ${visitId} not found`));
        }
      };
    });
  }

  async searchByContent(query: string, limit: number = 10): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(this.HISTORY_STORE);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result || [];
        
        // Filter entries that have content and are not deleted
        const entriesWithContent = entries.filter(
          (entry: HistoryEntry) => entry.pageContent && !entry.deleted
        );
        
        // Simple text-based search (will be enhanced with embeddings later)
        const results = entriesWithContent
          .filter((entry: HistoryEntry) => {
            const content = entry.pageContent?.toLowerCase() || '';
            const summary = entry.pageSummary?.toLowerCase() || '';
            const title = entry.title.toLowerCase();
            const searchQuery = query.toLowerCase();
            
            return content.includes(searchQuery) || 
                   summary.includes(searchQuery) || 
                   title.includes(searchQuery);
          })
          .sort((a, b) => b.visitTime - a.visitTime) // Sort by most recent first
          .slice(0, limit);
        
        resolve(results);
      };
    });
  }
}