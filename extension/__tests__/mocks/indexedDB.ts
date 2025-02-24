class MockIDBRequest {
  result: any = null;
  error: Error | null = null;
  onerror: ((event: Event) => void) | null = null;
  onsuccess: ((event: Event) => void) | null = null;

  _triggerSuccess() {
    if (this.onsuccess) {
      this.onsuccess(new Event('success'));
    }
  }

  _triggerError(error: Error) {
    this.error = error;
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

class MockIDBIndex {
  constructor(private store: MockIDBObjectStore, private keyPath: string) {}

  getAll(query?: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        const allData = Array.from(this.store.data.values());
        if (query !== undefined && query !== null) {
          request.result = allData.filter(item => item[this.keyPath] === query);
        } else {
          request.result = allData.sort((a, b) => {
            const aValue = a[this.keyPath];
            const bValue = b[this.keyPath];
            if (typeof aValue === 'number' && typeof bValue === 'number') {
              return bValue - aValue; // Sort in descending order for numbers
            }
            return String(aValue).localeCompare(String(bValue));
          });
        }
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }
}

class MockIDBObjectStore {
  data: Map<string, any> = new Map();
  private indexes: Map<string, MockIDBIndex> = new Map();

  put(value: any, key?: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        const actualKey = key || value.visitId;
        this.data.set(actualKey, value);
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }

  get(key: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        request.result = this.data.get(key);
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        request.result = Array.from(this.data.values());
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }

  createIndex(name: string, keyPath: string): MockIDBIndex {
    const index = new MockIDBIndex(this, keyPath);
    this.indexes.set(name, index);
    return index;
  }

  index(name: string): MockIDBIndex {
    const index = this.indexes.get(name);
    if (!index) {
      throw new Error(`Index ${name} not found`);
    }
    return index;
  }
}

class MockIDBTransaction {
  private store: MockIDBObjectStore;

  constructor(store: MockIDBObjectStore) {
    this.store = store;
  }

  objectStore(): MockIDBObjectStore {
    return this.store;
  }
}

class MockIDBDatabase {
  private store: MockIDBObjectStore = new MockIDBObjectStore();
  objectStoreNames = {
    contains: () => true
  };

  createObjectStore(name: string, options: any): MockIDBObjectStore {
    // Create indexes that are used in the app
    const store = this.store;
    store.createIndex('visitTime', 'visitTime');
    store.createIndex('syncStatus', 'syncStatus');
    store.createIndex('url', 'url');
    return store;
  }

  transaction(): MockIDBTransaction {
    return new MockIDBTransaction(this.store);
  }
}

export class MockIndexedDB {
  private databases: Map<string, MockIDBDatabase> = new Map();

  open(name: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        let db = this.databases.get(name);
        if (!db) {
          db = new MockIDBDatabase();
          this.databases.set(name, db);
        }
        request.result = db;
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }

  deleteDatabase(name: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        this.databases.delete(name);
        request._triggerSuccess();
      } catch (error) {
        request._triggerError(error as Error);
      }
    }, 0);
    return request;
  }
}

export function setupIndexedDBMock() {
  const mockIndexedDB = new MockIndexedDB();
  Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB,
    writable: true
  });
  return mockIndexedDB;
}