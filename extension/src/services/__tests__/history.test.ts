import { HistoryService, HistoryItem } from '../history';
import { IndexedDBStore } from '../../storage/indexeddb';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Mock chrome.history API
const mockHistoryItems = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example',
    lastVisitTime: Date.now(),
    visitCount: 5,
    typedCount: 2
  }
];

const mockVisits = [
  {
    id: '1',
    visitId: '1',
    visitTime: Date.now() - 1000,
    transition: 'link'
  }
];

global.chrome = {
  history: {
    search: jest.fn().mockResolvedValue(mockHistoryItems),
    getVisits: jest.fn().mockResolvedValue(mockVisits)
  }
} as any;

// Initialize real IndexedDB store with fake-indexeddb
const DB_NAME = 'chroniclesync-test';
const DB_VERSION = 1;

async function createTestStore(): Promise<IndexedDBStore> {
  // Clear any existing databases
  indexedDB = new IDBFactory();
  
  const store = new IndexedDBStore();
  await store.init(DB_NAME, DB_VERSION, ['history']);
  return store;
}

describe('HistoryService', () => {
  let historyService: HistoryService;
  let store: IndexedDBStore;

  beforeEach(async () => {
    store = await createTestStore();
    historyService = new HistoryService(store);
    jest.clearAllMocks();
  });

  describe('syncHistory', () => {
    it('should fetch and store history items', async () => {
      await historyService.syncHistory();

      expect(chrome.history.search).toHaveBeenCalled();
      expect(chrome.history.getVisits).toHaveBeenCalledWith({ url: mockHistoryItems[0].url });

      // Verify items were stored in IndexedDB
      const storedItems = await historyService.getHistory();
      expect(storedItems.length).toBe(1);
      expect(storedItems[0].url).toBe(mockHistoryItems[0].url);
      expect(storedItems[0].title).toBe(mockHistoryItems[0].title);
    });

    it('should use provided startTime', async () => {
      const startTime = Date.now() - 1000;
      await historyService.syncHistory(startTime);

      expect(chrome.history.search).toHaveBeenCalledWith(
        expect.objectContaining({ startTime })
      );
    });
  });

  describe('getHistory', () => {
    it('should return all history items', async () => {
      const testItem: HistoryItem = {
        id: btoa('https://test.com'),
        url: 'https://test.com',
        title: 'Test',
        visitTime: Date.now(),
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 1
      };

      // Store test item
      await store.put('history', testItem);

      const result = await historyService.getHistory();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(testItem);
    });
  });

  describe('getHistoryItem', () => {
    it('should return a specific history item', async () => {
      const testItem: HistoryItem = {
        id: btoa('https://test.com'),
        url: 'https://test.com',
        title: 'Test',
        visitTime: Date.now(),
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 1
      };

      // Store test item
      await store.put('history', testItem);

      const result = await historyService.getHistoryItem(testItem.id);
      expect(result).toEqual(testItem);
    });

    it('should return undefined for non-existent item', async () => {
      const result = await historyService.getHistoryItem('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteHistoryItem', () => {
    it('should delete a history item', async () => {
      const testItem: HistoryItem = {
        id: btoa('https://test.com'),
        url: 'https://test.com',
        title: 'Test',
        visitTime: Date.now(),
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 1
      };

      // Store and verify item exists
      await store.put('history', testItem);
      let result = await historyService.getHistoryItem(testItem.id);
      expect(result).toEqual(testItem);

      // Delete item
      await historyService.deleteHistoryItem(testItem.id);
      
      // Verify item was deleted
      result = await historyService.getHistoryItem(testItem.id);
      expect(result).toBeUndefined();
    });
  });

  describe('clearHistory', () => {
    it('should clear all history items', async () => {
      // Store multiple test items
      const testItems: HistoryItem[] = [
        {
          id: btoa('https://test1.com'),
          url: 'https://test1.com',
          title: 'Test 1',
          visitTime: Date.now(),
          lastVisitTime: Date.now(),
          visitCount: 1,
          typedCount: 1
        },
        {
          id: btoa('https://test2.com'),
          url: 'https://test2.com',
          title: 'Test 2',
          visitTime: Date.now(),
          lastVisitTime: Date.now(),
          visitCount: 1,
          typedCount: 1
        }
      ];

      await Promise.all(testItems.map(item => store.put('history', item)));

      // Verify items were stored
      let items = await historyService.getHistory();
      expect(items).toHaveLength(2);

      // Clear history
      await historyService.clearHistory();

      // Verify all items were deleted
      items = await historyService.getHistory();
      expect(items).toHaveLength(0);
    });
  });
});