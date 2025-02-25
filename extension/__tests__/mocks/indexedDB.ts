interface IDBEventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

class MockIDBRequest implements IDBEventTarget {
  result: unknown = null;
  error: Error | null = null;
  source: unknown = null;
  transaction: unknown = null;
  readyState: 'pending' | 'done' = 'pending';
  onerror: ((this: IDBRequest, ev: Event) => void) | null = null;
  onsuccess: ((this: IDBRequest, ev: Event) => void) | null = null;
  onupgradeneeded: ((this: IDBRequest, ev: Event) => void) | null = null;
  onblocked: ((this: IDBRequest, ev: Event) => void) | null = null;

  private listeners: Map<string, Set<EventListener>> = new Map();

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): void {
    if (event.type === 'error' && this.onerror) {
      this.onerror.call(this as unknown as IDBRequest, event);
    } else if (event.type === 'success' && this.onsuccess) {
      this.onsuccess.call(this as unknown as IDBRequest, event);
    } else if (event.type === 'upgradeneeded' && this.onupgradeneeded) {
      this.onupgradeneeded.call(this as unknown as IDBRequest, event);
    } else if (event.type === 'blocked' && this.onblocked) {
      this.onblocked.call(this as unknown as IDBRequest, event);
    }

    this.listeners.get(event.type)?.forEach(listener => listener(event));
  }
}

interface StoredData {
  visitId: string;
  [key: string]: unknown;
}

class MockIDBObjectStore {
  private data: Map<string, StoredData> = new Map();
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  put(value: StoredData): MockIDBRequest {
    const request = new MockIDBRequest();
    this.data.set(value.visitId, value);
    request.result = value.visitId;
    setTimeout(() => request.dispatchEvent(new Event('success')), 0);
    return request;
  }

  get(key: string): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = this.data.get(key) || null;
    setTimeout(() => request.dispatchEvent(new Event('success')), 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    request.result = Array.from(this.data.values());
    setTimeout(() => request.dispatchEvent(new Event('success')), 0);
    return request;
  }

  createIndex(_indexName: string, _keyPath: string): void {
    // Index creation is not needed for the mock
  }
}

class MockIDBTransaction {
  private stores: Map<string, MockIDBObjectStore>;

  constructor(stores: Map<string, MockIDBObjectStore>) {
    this.stores = stores;
  }

  objectStore(name: string): MockIDBObjectStore {
    const store = this.stores.get(name);
    if (!store) {
      throw new Error(`Store ${name} not found`);
    }
    return store;
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

  transaction(_storeNames: string[]): MockIDBTransaction {
    return new MockIDBTransaction(this.stores);
  }

  deleteObjectStore(name: string): void {
    this.stores.delete(name);
  }
}

class MockIDBFactoryImpl {
  private dbs = new Map<string, MockIDBDatabase>();

  open(_name: string, _version?: number): IDBOpenDBRequest {
    const request = new MockIDBRequest();
    const db = new MockIDBDatabase();
    this.dbs.set(_name, db);
    request.result = db;
    setTimeout(() => {
      request.dispatchEvent(new Event('upgradeneeded'));
      request.dispatchEvent(new Event('success'));
    }, 0);
    return request as unknown as IDBOpenDBRequest;
  }

  deleteDatabase(_name: string): IDBOpenDBRequest {
    const request = new MockIDBRequest();
    this.dbs.delete(_name);
    setTimeout(() => request.dispatchEvent(new Event('success')), 0);
    return request as unknown as IDBOpenDBRequest;
  }

  databases(): Promise<IDBDatabaseInfo[]> {
    return Promise.resolve(
      Array.from(this.dbs.keys()).map(name => ({ name, version: 1 }))
    );
  }

  cmp(a: unknown, b: unknown): number {
    return String(a).localeCompare(String(b));
  }
}

export const mockIndexedDB = new MockIDBFactoryImpl() as unknown as IDBFactory;