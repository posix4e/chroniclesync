import { DB } from '../db';

describe('DB', () => {
  let db: DB;
  let indexedDB: IDBFactory;
  let mockStore: Record<string, unknown>;

  beforeEach(() => {
    mockStore = {};
    const mockIDBRequest = {
      result: {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            get: jest.fn().mockImplementation(() => ({
              onsuccess: null,
              onerror: null,
              result: mockStore['userData']
            })),
            put: jest.fn().mockImplementation((data) => {
              mockStore['userData'] = data;
              return {
                onsuccess: null,
                onerror: null
              };
            })
          })
        }),
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(true)
        }
      },
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null
    };

    // Mock indexedDB
    indexedDB = {
      open: jest.fn().mockImplementation(() => {
        setTimeout(() => {
          mockIDBRequest.onsuccess?.({
            target: mockIDBRequest
          } as Event);
        }, 0);
        return mockIDBRequest;
      })
    } as unknown as IDBFactory;

    // Replace global indexedDB with mock
    Object.defineProperty(window, 'indexedDB', {
      value: indexedDB,
      writable: true
    });

    db = new DB();
  });

  it('should initialize with a client ID', async () => {
    const clientId = 'test-client';
    await db.init(clientId);
    expect(db.clientId).toBe(clientId);
    expect(indexedDB.open).toHaveBeenCalledWith(`sync_${clientId}`, 1);
  });

  it('should get data from store', async () => {
    const testData = { key: 'value' };
    mockStore['userData'] = testData;

    await db.init('test-client');
    const data = await db.getData();

    expect(data).toEqual(testData);
  });

  it('should set data in store', async () => {
    const testData = { key: 'value' };

    await db.init('test-client');
    await db.setData(testData);

    expect(mockStore['userData']).toEqual(testData);
  });

  it('should throw error if not initialized', async () => {
    await expect(db.getData()).rejects.toThrow('Database not initialized');
    await expect(db.setData({})).rejects.toThrow('Database not initialized');
  });
});