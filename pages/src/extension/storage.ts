import { ICrypto } from './crypto';

export class Storage {
  constructor(private crypto: ICrypto) {}

  async store(key: string, encryptedData: string): Promise<void> {
    // Store in IndexedDB first
    await this.storeLocal(key, encryptedData);
        
    // Then sync to remote if possible
    try {
      await this.syncToRemote(key, encryptedData);
    } catch (error) {
      console.warn('Failed to sync to remote, will retry later:', error);
    }
  }

  private async storeLocal(key: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChronicleSync', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('syncData', 'readwrite');
        const store = tx.objectStore('syncData');

        store.put({
          key,
          data,
          timestamp: Date.now(),
          synced: false
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('syncData', { keyPath: 'key' });
      };
    });
  }

  private async syncToRemote(key: string, data: string): Promise<void> {
    const response = await fetch('https://api.chroniclesync.xyz/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key,
        data,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync: ${response.statusText}`);
    }

    // Mark as synced in local storage
    await this.markAsSynced(key);
  }

  private async markAsSynced(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChronicleSync', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('syncData', 'readwrite');
        const store = tx.objectStore('syncData');

        const getRequest = store.get(key);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (data) {
            data.synced = true;
            store.put(data);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onerror = () => reject(request.error);
    });
  }
}