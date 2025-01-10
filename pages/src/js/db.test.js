import { DB } from './db';

describe('DB', () => {
  let db;
  let mockRequest;
  let mockDB;

  beforeEach(() => {
    mockRequest = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: null,
    };

    mockDB = {
      transaction: jest.fn(),
      objectStoreNames: {
        contains: jest.fn(),
      },
      createObjectStore: jest.fn(),
    };

    indexedDB.open.mockReturnValue(mockRequest);
    db = new DB();
  });

  it('initializes database with client ID', async () => {
    const clientId = 'test123';
    const initPromise = db.init(clientId);

    expect(indexedDB.open).toHaveBeenCalledWith(`sync_${clientId}`, 1);

    mockRequest.result = mockDB;
    mockRequest.onsuccess();

    await initPromise;
    expect(db.db).toBe(mockDB);
  });

  it('creates object store if not exists', async () => {
    const clientId = 'test123';
    const initPromise = db.init(clientId);

    mockDB.objectStoreNames.contains.mockReturnValue(false);
    mockRequest.result = mockDB;
    mockRequest.onupgradeneeded({ target: { result: mockDB } });

    expect(mockDB.createObjectStore).toHaveBeenCalledWith('data');

    mockRequest.onsuccess();
    await initPromise;
  });

  it('gets data from store', async () => {
    const mockStore = {
      get: jest.fn(),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const getPromise = db.getData();
    
    const mockRequest = {
      result: { key: 'value' },
    };
    mockStore.get.mockReturnValue(mockRequest);
    mockRequest.onsuccess();

    const result = await getPromise;
    expect(result).toEqual({ key: 'value' });
  });

  it('sets data in store', async () => {
    const mockStore = {
      put: jest.fn(),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const data = { key: 'value' };
    const setPromise = db.setData(data);
    
    const mockRequest = {};
    mockStore.put.mockReturnValue(mockRequest);
    mockRequest.onsuccess();

    await setPromise;
    expect(mockStore.put).toHaveBeenCalledWith(data, 'userData');
  });
});