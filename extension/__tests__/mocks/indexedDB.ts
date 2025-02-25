class MockIDBRequest {
  result: any = null;
  error: Error | null = null;
  source: any = null;
  transaction: any = null;
  readyState: string = 'pending';
  onerror: ((this: IDBRequest, ev: Event) => any) | null = null;
  onsuccess: ((this: IDBRequest, ev: Event) => any) | null = null;
  onupgradeneeded: ((this: IDBRequest, ev: Event) => any) | null = null;

  dispatchEvent(event: { type: string }) {
    if (event.type === 'error' && this.onerror) {
      this.onerror(new Event('error'));
    } else if (event.type === 'success' && this.onsuccess) {
      this.onsuccess(new Event('success'));
    } else if (event.type === 'upgradeneeded' && this.onupgradeneeded) {
      this.onupgradeneeded(new Event('upgradeneeded'));
    }
  }
}

class MockIDBObjectStore {
  private data: Map<string, any> = new Map();
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  put(value: any): MockIDBRequest {
    const request = new MockIDBRequest();
    this.data.set(value.visitId, value);
    request.result = value.visitId;
    setTimeout(() => request.dispatchEvent({ type: 'success' }), 0);
    return request;
  }

  get(key: string): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = this.data.get(key) || null;
    setTimeout(() => request.dispatchEvent({ type: 'success' }), 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = Array.from(this.data.values());
    setTimeout(() => request.dispatchEvent({ type: 'success' }), 0);
    return request;
  }

  createIndex(name: string, keyPath: string): void {}
}

class MockIDBTransaction {
  private stores: Map<string, MockIDBObjectStore>;

  constructor(stores: Map<string, MockIDBObjectStore>) {
    this.stores = stores;
  }

  objectStore(name: string): MockIDBObjectStore {
    return this.stores.get(name)!;
  }
}

class MockIDBDatabase {
  private stores: Map<string, MockIDBObjectStore> = new Map();
  objectStoreNames = {
    contains: (name: string) => this.stores.has(name)
  };

  createObjectStore(name: string): MockIDBObjectStore {
    const store = new MockIDBObjectStore(name);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames: string[]): MockIDBTransaction {
    return new MockIDBTransaction(this.stores);
  }

  deleteObjectStore(name: string): void {
    this.stores.delete(name);
  }
}

export const mockIndexedDB = {
  open: (name: string, version?: number): MockIDBRequest => {
    const request = new MockIDBRequest();
    request.result = new MockIDBDatabase();
    setTimeout(() => {
      request.dispatchEvent({ type: 'upgradeneeded' });
      request.dispatchEvent({ type: 'success' });
    }, 0);
    return request;
  }
};