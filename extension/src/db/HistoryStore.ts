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
        }

        // Create or update devices store
        if (!db.objectStoreNames.contains(this.DEVICE_STORE)) {
          const deviceStore = db.createObjectStore(this.DEVICE_STORE, { keyPath: 'deviceId' });
          deviceStore.createIndex('lastSeen', 'lastSeen');
          console.log('Created devices store');
        }
        
        // Add content index for version 3
        if (oldVersion < 3) {
          // During onupgradeneeded, we already have an active transaction
          // We can get the object store directly from the database
          const historyStore = db.objectStoreNames.contains(this.HISTORY_STORE) 
            ? event.target.transaction.objectStore(this.HISTORY_STORE)
            : null;
            
          // Create index for page content if the store exists and index doesn't exist
          if (historyStore && !historyStore.indexNames.contains('hasContent')) {
            historyStore.createIndex('hasContent', 'pageContent', { unique: false });
            console.log('Added page content index');
          }
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

  async updatePageContent(url: string, pageContent: { content: string, summary: string }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(this.HISTORY_STORE);
      const urlIndex = store.index('url');
      const request = urlIndex.getAll(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result;
        if (entries && entries.length > 0) {
          // Find the most recent entry for this URL
          const mostRecentEntry = entries.reduce((latest, current) => {
            return current.visitTime > latest.visitTime ? current : latest;
          }, entries[0]);
          
          // Update the entry with page content
          mostRecentEntry.pageContent = {
            content: pageContent.content,
            summary: pageContent.summary,
            extractedAt: Date.now()
          };
          mostRecentEntry.syncStatus = 'pending';
          mostRecentEntry.lastModified = Date.now();
          
          const updateRequest = store.put(mostRecentEntry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          // No entries found for this URL
          resolve();
        }
      };
    });
  }

  async searchContent(query: string): Promise<{ entry: HistoryEntry, matches: { text: string, context: string }[] }[]> {
    if (!this.db) throw new Error('Database not initialized');
    if (!query || query.trim().length === 0) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(this.HISTORY_STORE);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result || [];
        const results: { entry: HistoryEntry, matches: { text: string, context: string }[] }[] = [];
        
        // Filter entries with page content and not deleted
        const entriesWithContent = entries.filter(entry => 
          !entry.deleted && 
          entry.pageContent && 
          entry.pageContent.content
        );
        
        // Search for query in content
        const lowerQuery = query.toLowerCase();
        
        for (const entry of entriesWithContent) {
          const content = entry.pageContent!.content.toLowerCase();
          const matches: { text: string, context: string }[] = [];
          
          let startIndex = 0;
          while (startIndex < content.length) {
            const foundIndex = content.indexOf(lowerQuery, startIndex);
            if (foundIndex === -1) break;
            
            // Get context around the match (100 chars before and after)
            const contextStart = Math.max(0, foundIndex - 100);
            const contextEnd = Math.min(content.length, foundIndex + query.length + 100);
            const matchText = entry.pageContent!.content.substring(foundIndex, foundIndex + query.length);
            const context = entry.pageContent!.content.substring(contextStart, contextEnd);
            
            matches.push({
              text: matchText,
              context: context
            });
            
            startIndex = foundIndex + query.length;
          }
          
          if (matches.length > 0) {
            results.push({
              entry,
              matches
            });
          }
        }
        
        resolve(results);
      };
    });
  }
}