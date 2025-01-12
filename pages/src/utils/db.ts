export class DB {
  private db: IDBDatabase | null = null;
  private _clientId: string | null = null;

  get clientId(): string | null {
    return this._clientId;
  }

  async init(clientId: string): Promise<void> {
    this._clientId = clientId;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`sync_${clientId}`, 1);

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
          const historyStore = db.createObjectStore('history', { keyPath: 'timestamp' });
          historyStore.createIndex('url', 'url', { unique: false });
          historyStore.createIndex('title', 'title', { unique: false });
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

  async addHistoryEntry(entry: { url: string; title: string; timestamp?: number }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const historyEntry = {
        ...entry,
        timestamp: entry.timestamp || Date.now()
      };
      const request = store.add(historyEntry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getHistory(startTime?: number, endTime?: number): Promise<Array<{ url: string; title: string; timestamp: number }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let history = request.result;
        if (startTime) {
          history = history.filter(entry => entry.timestamp >= startTime);
        }
        if (endTime) {
          history = history.filter(entry => entry.timestamp <= endTime);
        }
        resolve(history);
      };
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