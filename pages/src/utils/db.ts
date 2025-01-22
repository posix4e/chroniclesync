export interface HistoryEntry {
  timestamp: number;
  action: string;
  data: {
    url?: string;
    [key: string]: unknown;
  };
  clientId: string;
  synced?: boolean;
}

export class DB {
  private db: IDBDatabase | null = null;
  private _clientId: string | null = null;

  get clientId(): string | null {
    return this._clientId;
  }

  async init(clientId: string): Promise<void> {
    this._clientId = clientId;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('chronicleSync', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'timestamp' });
          historyStore.createIndex('action', 'action', { unique: false });
          historyStore.createIndex('clientId', 'clientId', { unique: false });
          historyStore.createIndex('synced', 'synced', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  async getData(): Promise<Record<string, unknown>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get('userData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || {});
    });
  }

  async setData(data: Record<string, unknown>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data', 'history'], 'readwrite');
      const store = transaction.objectStore('data');
      const historyStore = transaction.objectStore('history');

      const request = store.put(data, 'userData');
      const historyEntry = {
        timestamp: Date.now(),
        action: 'setData',
        data,
        clientId: this._clientId,
        synced: false
      };

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const historyRequest = historyStore.add(historyEntry);
        historyRequest.onerror = () => reject(historyRequest.error);
        historyRequest.onsuccess = () => resolve();
      };
    });
  }

  async getHistory(): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addHistoryEntry(action: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');

      const entry: HistoryEntry = {
        timestamp: Date.now(),
        action,
        data,
        clientId: this._clientId!,
        synced: false
      };

      const request = store.add(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async markEntriesAsSynced(timestamps: number[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');

      let completed = 0;
      let errors = 0;

      timestamps.forEach(timestamp => {
        const request = store.get(timestamp);

        request.onsuccess = () => {
          const entry = request.result;
          if (entry) {
            entry.synced = true;
            const updateRequest = store.put(entry);

            updateRequest.onsuccess = () => {
              completed++;
              if (completed + errors === timestamps.length) {
                if (errors > 0) {
                  reject(new Error(`Failed to mark ${errors} entries as synced`));
                } else {
                  resolve();
                }
              }
            };

            updateRequest.onerror = () => {
              errors++;
              if (completed + errors === timestamps.length) {
                reject(new Error(`Failed to mark ${errors} entries as synced`));
              }
            };
          }
        };

        request.onerror = () => {
          errors++;
          if (completed + errors === timestamps.length) {
            reject(new Error(`Failed to mark ${errors} entries as synced`));
          }
        };
      });
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._clientId = null;
    }
  }
}