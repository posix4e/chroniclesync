class DB {
  constructor() {
    this.db = null;
    this.clientId = null;
  }

  async init(clientId) {
    this.clientId = clientId;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`sync_${clientId}`, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
    });
  }

  async getData() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get('userData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || {});
    });
  }

  async setData(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(data, 'userData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}