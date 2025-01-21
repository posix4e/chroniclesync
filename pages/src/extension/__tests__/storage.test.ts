import { Storage } from '../storage';
import { ICrypto } from '../crypto';
import 'fake-indexeddb/auto';

// Add structuredClone polyfill
if (typeof structuredClone === 'undefined') {
  (global as { structuredClone?: (obj: unknown) => unknown }).structuredClone = 
    (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

class MockCrypto implements ICrypto {
  async initialize(_password: string): Promise<void> {}

  async encrypt(data: string): Promise<string> {
    return `encrypted:${data}`;
  }

  async decrypt(data: string): Promise<string> {
    return data.replace('encrypted:', '');
  }
}

describe('Storage', () => {
  let storage: Storage;
  let mockCrypto: MockCrypto;
  let originalIndexedDB: IDBFactory;

  beforeEach(() => {
    // Mock fetch to fail
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({ ok: false, statusText: 'Service Unavailable' } as Response)
    );

    // Create a new instance of Storage and MockCrypto
    mockCrypto = new MockCrypto();
    storage = new Storage(mockCrypto);

    // Save original indexedDB and create a new instance
    originalIndexedDB = indexedDB;
    Object.defineProperty(window, 'indexedDB', {
      value: new IDBFactory(),
      configurable: true
    });
  });

  afterEach(() => {
    // Restore original indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: originalIndexedDB,
      configurable: true
    });
  });

  // Increase timeout for all tests
  jest.setTimeout(120000);

  it('should store data locally', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Create the database first
    const openRequest = indexedDB.open('ChronicleSync', 1);
    await new Promise<void>((resolve, reject) => {
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('syncData', { keyPath: 'key' });
      };
      openRequest.onsuccess = () => {
        openRequest.result.close();
        resolve();
      };
    });

    // Encrypt and store the data
    const encryptedData = await mockCrypto.encrypt(data);
    await storage.store(key, encryptedData);

    // Verify the data
    const verifyRequest = indexedDB.open('ChronicleSync', 1);
    const storedData = await new Promise((resolve, reject) => {
      verifyRequest.onerror = () => reject(verifyRequest.error);
      verifyRequest.onsuccess = () => {
        const db = verifyRequest.result;
        const tx = db.transaction('syncData', 'readonly');
        const store = tx.objectStore('syncData');
        const getRequest = store.get(key);

        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => resolve(getRequest.result);

        tx.oncomplete = () => db.close();
      };
    });

    // Verify the stored data
    expect(storedData).toEqual({
      key,
      data: 'encrypted:test-data',
      synced: false,
      timestamp: expect.any(Number)
    });
  });

  it('should handle IndexedDB errors', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Mock indexedDB.open to simulate an error
    const error = new Error('IndexedDB error');
    const mockOpen = jest.spyOn(IDBFactory.prototype, 'open');
    mockOpen.mockImplementation(() => {
      const request = Object.create(IDBOpenDBRequest.prototype) as IDBOpenDBRequest;
      setTimeout(() => {
        Object.defineProperty(request, 'error', { value: error });
        request.onerror?.(new Event('error'));
      }, 0);
      return request;
    });

    // Encrypt and store the data
    const encryptedData = await mockCrypto.encrypt(data);
    await expect(storage.store(key, encryptedData)).rejects.toThrow('IndexedDB error');

    mockOpen.mockRestore();
  });

  it('should store encrypted data', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Create the database first
    const openRequest = indexedDB.open('ChronicleSync', 1);
    await new Promise<void>((resolve, reject) => {
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('syncData', { keyPath: 'key' });
      };
      openRequest.onsuccess = () => {
        openRequest.result.close();
        resolve();
      };
    });

    // Encrypt and store the data
    const encryptedData = await mockCrypto.encrypt(data);
    await storage.store(key, encryptedData);

    // Verify the data
    const verifyRequest = indexedDB.open('ChronicleSync', 1);
    const storedData = await new Promise((resolve, reject) => {
      verifyRequest.onerror = () => reject(verifyRequest.error);
      verifyRequest.onsuccess = () => {
        const db = verifyRequest.result;
        const tx = db.transaction('syncData', 'readonly');
        const store = tx.objectStore('syncData');
        const getRequest = store.get(key);

        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => resolve(getRequest.result);

        tx.oncomplete = () => db.close();
      };
    });

    // Verify the data was encrypted
    expect(storedData).toEqual({
      key,
      data: 'encrypted:test-data',
      synced: false,
      timestamp: expect.any(Number)
    });
  });
});