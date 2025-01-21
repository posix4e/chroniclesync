import { Storage } from '../storage';
import { ICrypto } from '../crypto';

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
  let mockIndexedDB: IDBFactory;
  let mockStore: IDBObjectStore;
  let mockTransaction: IDBTransaction;
  let mockDBRequest: IDBOpenDBRequest;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock fetch
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({ ok: true } as Response)
    );

    // Mock IndexedDB
    mockStore = {
      put: jest.fn().mockImplementation(() => {
        const request = {
          onsuccess: jest.fn(),
          onerror: jest.fn()
        };
        return request;
      }),
      get: jest.fn().mockImplementation(() => {
        const request = {
          onsuccess: jest.fn(),
          onerror: jest.fn()
        };
        return request;
      })
    } as unknown as IDBObjectStore;

    mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
      oncomplete: null,
      onerror: null,
      complete: false
    } as unknown as IDBTransaction;

    const mockDB = {
      transaction: jest.fn().mockReturnValue(mockTransaction)
    } as unknown as IDBDatabase;

    mockDBRequest = {
      onerror: jest.fn(),
      onsuccess: jest.fn(),
      onupgradeneeded: jest.fn(),
      result: mockDB,
      error: null
    } as unknown as IDBOpenDBRequest;

    mockIndexedDB = {
      open: jest.fn().mockImplementation(() => {
        return mockDBRequest;
      })
    } as unknown as IDBFactory;

    // @ts-expect-error Mock indexedDB for testing
    global.indexedDB = mockIndexedDB;

    mockCrypto = new MockCrypto();
    storage = new Storage(mockCrypto);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store data locally', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Start the storage operation
    const storagePromise = storage.store(key, data);

    // Simulate IndexedDB open success
    if (mockDBRequest.onsuccess) {
      mockDBRequest.onsuccess({ target: mockDBRequest } as Event);
    }

    // Simulate transaction completion
    if (mockTransaction.oncomplete) {
      mockTransaction.oncomplete({} as Event);
    }

    // Advance timers
    jest.advanceTimersByTime(1000);

    // Wait for the operation to complete
    await storagePromise;

    // Verify the operations
    expect(mockIndexedDB.open).toHaveBeenCalledWith('ChronicleSync', 1);
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('syncData');
    expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
      key,
      data: expect.stringContaining('encrypted:'),
      synced: false
    }));
  });

  it('should handle IndexedDB errors', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Mock open to trigger error
    mockIndexedDB.open.mockImplementation(() => {
      const request = {
        onerror: jest.fn(),
        onsuccess: jest.fn(),
        onupgradeneeded: jest.fn(),
        error: new Error('IndexedDB error')
      } as unknown as IDBOpenDBRequest;

      // Trigger error immediately
      if (request.onerror) {
        request.onerror({ target: request } as Event);
      }

      return request;
    });

    // Start the storage operation and expect it to fail
    await expect(storage.store(key, data)).rejects.toThrow('IndexedDB error');
  });

  it('should store encrypted data', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Start the storage operation
    const storagePromise = storage.store(key, data);

    // Simulate IndexedDB open success
    if (mockDBRequest.onsuccess) {
      mockDBRequest.onsuccess({ target: mockDBRequest } as Event);
    }

    // Simulate transaction completion
    if (mockTransaction.oncomplete) {
      mockTransaction.oncomplete({} as Event);
    }

    // Advance timers
    jest.advanceTimersByTime(1000);

    // Wait for the operation to complete
    await storagePromise;

    // Verify the data was encrypted
    expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
      key,
      data: expect.stringContaining('encrypted:'),
      synced: false
    }));
  });
});