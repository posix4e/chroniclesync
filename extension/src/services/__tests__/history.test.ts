import { HistoryService, HistoryItem } from '../history';
import { IndexedDBStore } from '../../storage/indexeddb';

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

// Mock IndexedDBStore
const mockStore = {
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
} as unknown as IndexedDBStore;

describe('HistoryService', () => {
  let historyService: HistoryService;

  beforeEach(() => {
    historyService = new HistoryService(mockStore);
    jest.clearAllMocks();
  });

  describe('syncHistory', () => {
    it('should fetch and store history items', async () => {
      await historyService.syncHistory();

      expect(chrome.history.search).toHaveBeenCalled();
      expect(chrome.history.getVisits).toHaveBeenCalledWith({ url: mockHistoryItems[0].url });
      expect(mockStore.put).toHaveBeenCalled();
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
      const mockItems: HistoryItem[] = [
        {
          id: 'test',
          url: 'https://test.com',
          title: 'Test',
          visitTime: Date.now(),
          lastVisitTime: Date.now(),
          visitCount: 1,
          typedCount: 1
        }
      ];
      mockStore.getAll.mockResolvedValue(mockItems);

      const result = await historyService.getHistory();
      expect(result).toEqual(mockItems);
      expect(mockStore.getAll).toHaveBeenCalledWith('history');
    });
  });

  describe('getHistoryItem', () => {
    it('should return a specific history item', async () => {
      const mockItem: HistoryItem = {
        id: 'test',
        url: 'https://test.com',
        title: 'Test',
        visitTime: Date.now(),
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 1
      };
      mockStore.get.mockResolvedValue(mockItem);

      const result = await historyService.getHistoryItem('test');
      expect(result).toEqual(mockItem);
      expect(mockStore.get).toHaveBeenCalledWith('history', 'test');
    });
  });

  describe('deleteHistoryItem', () => {
    it('should delete a history item', async () => {
      await historyService.deleteHistoryItem('test');
      expect(mockStore.delete).toHaveBeenCalledWith('history', 'test');
    });
  });

  describe('clearHistory', () => {
    it('should clear all history items', async () => {
      await historyService.clearHistory();
      expect(mockStore.clear).toHaveBeenCalledWith('history');
    });
  });
});