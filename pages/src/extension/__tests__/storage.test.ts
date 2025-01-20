import { Storage } from '../../src/storage';
import { ICrypto } from '../../src/crypto';

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
        request.onsuccess({});
        return request;
      }),
      get: jest.fn().mockImplementation(() => {
        const request = {
          onsuccess: jest.fn(),
          onerror: jest.fn()
        };
        request.onsuccess({});
        return request;
      })
    };

    mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
      oncomplete: jest.fn(),
      onerror: jest.fn(),
      complete: false
    };

    const mockDB = {
      transaction: jest.fn().mockReturnValue(mockTransaction)
    };

    mockDBRequest = {
      onerror: jest.fn(),
      onsuccess: jest.fn(),
      onupgradeneeded: jest.fn(),
      result: mockDB,
      error: null
    };

    mockIndexedDB = {
      open: jest.fn().mockImplementation(() => {
        mockDBRequest.onsuccess({ target: mockDBRequest });
        return mockDBRequest;
      })
    };

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

    // Simulate transaction completion
    mockTransaction.oncomplete();

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
  }, 30000);

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
      };

      request.onerror({ target: request });
      return request;
    });

    // Start the storage operation and expect it to fail
    await expect(storage.store(key, data)).rejects.toThrow('IndexedDB error');
  }, 30000);

  it('should store encrypted data', async () => {
    const key = 'test-key';
    const data = 'test-data';

    // Start the storage operation
    const storagePromise = storage.store(key, data);

    // Simulate transaction completion
    mockTransaction.oncomplete();

    // Wait for the operation to complete
    await storagePromise;

    // Verify the data was encrypted
    expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
      key,
      data: expect.stringContaining('encrypted:'),
      synced: false
    }));
  }, 30000);
});
