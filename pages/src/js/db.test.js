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

  it('skips object store creation if exists', async () => {
    const clientId = 'test123';
    const initPromise = db.init(clientId);

    mockDB.objectStoreNames.contains.mockReturnValue(true);
    mockRequest.result = mockDB;
    mockRequest.onupgradeneeded({ target: { result: mockDB } });

    expect(mockDB.createObjectStore).not.toHaveBeenCalled();

    mockRequest.onsuccess();
    await initPromise;
  });

  it('handles upgrade error', async () => {
    const clientId = 'test123';
    const initPromise = db.init(clientId);

    mockDB.objectStoreNames.contains.mockReturnValue(false);
    mockDB.createObjectStore.mockImplementation(() => {
      throw new Error('Upgrade error');
    });
    mockRequest.result = mockDB;

    expect(() => {
      mockRequest.onupgradeneeded({ target: { result: mockDB } });
    }).toThrow('Upgrade error');

    mockRequest.error = new Error('Upgrade error');
    mockRequest.onerror();
    await expect(initPromise).rejects.toThrow('Upgrade error');
  });

  it('handles database error', async () => {
    const clientId = 'test123';
    const initPromise = db.init(clientId);

    mockRequest.error = new Error('DB error');
    mockRequest.onerror();

    await expect(initPromise).rejects.toThrow('DB error');
  });

  it('gets data from store', async () => {
    const mockRequest = {
      onerror: null,
      onsuccess: null,
      result: { key: 'value' },
    };

    const mockStore = {
      get: jest.fn().mockReturnValue(mockRequest),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const getPromise = db.getData();
    mockRequest.onsuccess();

    const result = await getPromise;
    expect(result).toEqual({ key: 'value' });
  });

  it('returns empty object if no data exists', async () => {
    const mockRequest = {
      onerror: null,
      onsuccess: null,
      result: null,
    };

    const mockStore = {
      get: jest.fn().mockReturnValue(mockRequest),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const getPromise = db.getData();
    mockRequest.onsuccess();

    const result = await getPromise;
    expect(result).toEqual({});
  });

  it('handles getData error', async () => {
    const mockRequest = {
      onerror: null,
      onsuccess: null,
      error: new Error('DB error'),
    };

    const mockStore = {
      get: jest.fn().mockReturnValue(mockRequest),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const getPromise = db.getData();
    mockRequest.onerror();

    await expect(getPromise).rejects.toThrow('DB error');
  });

  it('sets data in store', async () => {
    const mockRequest = {
      onerror: null,
      onsuccess: null,
    };

    const mockStore = {
      put: jest.fn().mockReturnValue(mockRequest),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const data = { key: 'value' };
    const setPromise = db.setData(data);
    mockRequest.onsuccess();

    await setPromise;
    expect(mockStore.put).toHaveBeenCalledWith(data, 'userData');
  });

  it('handles setData error', async () => {
    const mockRequest = {
      onerror: null,
      onsuccess: null,
      error: new Error('DB error'),
    };

    const mockStore = {
      put: jest.fn().mockReturnValue(mockRequest),
    };

    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };

    mockDB.transaction.mockReturnValue(mockTransaction);
    db.db = mockDB;

    const data = { key: 'value' };
    const setPromise = db.setData(data);
    mockRequest.onerror();

    await expect(setPromise).rejects.toThrow('DB error');
  });
});