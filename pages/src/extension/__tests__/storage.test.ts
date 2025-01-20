import { StorageManager } from '../storage';
import { encryptData } from '../crypto';

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
  });

  describe('syncData', () => {
    interface MockDB {
      transaction: jest.Mock;
      objectStore: jest.Mock;
      add: jest.Mock;
      get: jest.Mock;
    }

    let mockDB: MockDB;
    let mockTransaction: jest.Mock;
    let mockObjectStore: jest.Mock;

    beforeEach(() => {
      mockObjectStore = jest.fn();
      mockTransaction = jest.fn(() => ({ objectStore: mockObjectStore }));
      mockDB = {
        transaction: mockTransaction,
        objectStore: jest.fn(),
        add: jest.fn(),
        get: jest.fn(),
      };
    });

    it('should store encrypted data', async () => {
      const mockData = { key: 'test', value: 'data' };
      const mockEncryptedData = 'encryptedData';

      jest.spyOn(window.indexedDB, 'open').mockImplementation(() => {
        const request = {
          result: mockDB,
          onupgradeneeded: null as (() => void) | null,
          onsuccess: null as (() => void) | null,
        };

        setTimeout(() => {
          request.onsuccess?.({} as Event);
        }, 0);

        return request as IDBOpenDBRequest;
      });

      // @ts-expect-error Mock implementation
      jest.spyOn(encryptData).mockResolvedValue(mockEncryptedData);

      await storageManager.syncData(mockData);

      expect(mockTransaction).toHaveBeenCalledWith('syncData', 'readwrite');
      expect(mockObjectStore).toHaveBeenCalledWith('syncData');
    });
  });
});