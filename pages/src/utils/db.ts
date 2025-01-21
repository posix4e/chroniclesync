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
          historyStore.createIndex('action', 'action', { unique: false });
        }
      };
    });
  }

  async addHistoryEntry(action: string, data: unknown): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const entry = {
        timestamp: Date.now(),
        action,
        data,
        clientId: this._clientId
      };
      const request = store.add(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getHistory(since?: number): Promise<Array<{ timestamp: number; action: string; data: unknown; clientId: string }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = since 
        ? store.openCursor(IDBKeyRange.lowerBound(since))
        : store.openCursor();

      const entries: Array<{ timestamp: number; action: string; data: unknown; clientId: string }> = [];
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          entries.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries);
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
      const transaction = this.db!.transaction(['data', 'history'], 'readwrite');
      const store = transaction.objectStore('data');
      const historyStore = transaction.objectStore('history');

      const request = store.put(data, 'userData');
      const historyEntry = {
        timestamp: Date.now(),
        action: 'setData',
        data,
        clientId: this._clientId
      };

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const historyRequest = historyStore.add(historyEntry);
        historyRequest.onerror = () => reject(historyRequest.error);
        historyRequest.onsuccess = () => resolve();
      };
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