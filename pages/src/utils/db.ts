import { BrowserMetadata, HistoryItem, SyncedHistory } from '../types';

export class DB {
  private db: IDBDatabase | null = null;
  private _clientId: string | null = null;

  get clientId(): string | null {
    return this._clientId;
  }

  async init(clientId: string): Promise<void> {
    this._clientId = clientId;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`sync_${clientId}`, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('visitTime', 'visitTime');
          historyStore.createIndex('url', 'url');
        }
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
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(data, 'userData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addHistoryItems(items: HistoryItem[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');

      let completed = 0;
      let errors: Error[] = [];

      items.forEach(item => {
        const request = store.put(item);
        request.onerror = () => {
          errors.push(request.error!);
          if (++completed === items.length) {
            if (errors.length > 0) {
              reject(new Error(`Failed to add ${errors.length} history items`));
            } else {
              resolve();
            }
          }
        };
        request.onsuccess = () => {
          if (++completed === items.length) {
            if (errors.length > 0) {
              reject(new Error(`Failed to add ${errors.length} history items`));
            } else {
              resolve();
            }
          }
        };
      });
    });
  }

  async getHistoryItems(startTime?: number, endTime?: number): Promise<HistoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('visitTime');

      let range: IDBKeyRange | null = null;
      if (startTime && endTime) {
        range = IDBKeyRange.bound(startTime, endTime);
      } else if (startTime) {
        range = IDBKeyRange.lowerBound(startTime);
      } else if (endTime) {
        range = IDBKeyRange.upperBound(endTime);
      }

      const request = range ? index.getAll(range) : store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getHistoryByUrl(url: string): Promise<HistoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('url');
      const request = index.getAll(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}