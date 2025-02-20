import { BidirectionalSyncService } from '../services/BidirectionalSyncService';
import { HistoryItem } from '../types/history';

describe('BidirectionalSyncService', () => {
  let service: BidirectionalSyncService;
  let mockFetch: jest.Mock;
  let mockChromeStorage: any;
  let mockChromeHistory: any;

  beforeEach(() => {
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock chrome.storage.local
    mockChromeStorage = {
      get: jest.fn(),
      set: jest.fn()
    };
    global.chrome = {
      storage: {
        local: mockChromeStorage
      },
      history: mockChromeHistory,
      runtime: {
        sendMessage: jest.fn()
      }
    } as any;

    // Mock chrome.history
    mockChromeHistory = {
      search: jest.fn()
    };

    // Reset singleton instance
    (BidirectionalSyncService as any).instance = null;
    service = BidirectionalSyncService.getInstance();
  });

  describe('sync', () => {
    it('should merge local and remote changes', async () => {
      const localHistory: HistoryItem[] = [
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example',
          lastVisitTime: '2024-02-19T00:00:00.000Z',
          visitCount: 1
        }
      ];

      const remoteHistory: HistoryItem[] = [
        {
          id: '2',
          url: 'https://test.com',
          title: 'Test',
          lastVisitTime: '2024-02-19T01:00:00.000Z',
          visitCount: 1
        }
      ];

      mockChromeHistory.search.mockImplementation((options, callback) => {
        callback(localHistory);
      });

      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/changes')) {
          return {
            ok: true,
            json: async () => remoteHistory
          };
        }
        return {
          ok: true,
          json: async () => ({})
        };
      });

      mockChromeStorage.get.mockImplementation((key, callback) => {
        callback({ authToken: 'test-token' });
      });

      await service.sync();

      // Verify storage was updated with merged history
      expect(mockChromeStorage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.arrayContaining([
            expect.objectContaining(localHistory[0]),
            expect.objectContaining(remoteHistory[0])
          ])
        }),
        expect.any(Function)
      );
    });

    it('should handle offline state', async () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      await service.sync();

      // Verify no network requests were made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('Network error');
      });

      mockChromeStorage.get.mockImplementation((key, callback) => {
        callback({ authToken: 'test-token' });
      });

      await service.sync();

      // Verify error state
      expect(service.getSyncStatus().error).toBeDefined();
    });
  });

  describe('local storage', () => {
    it('should retrieve local history', async () => {
      const mockHistory = [
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example',
          lastVisitTime: '2024-02-19T00:00:00.000Z',
          visitCount: 1
        }
      ];

      mockChromeStorage.get.mockImplementation((key, callback) => {
        callback({ history: mockHistory });
      });

      const history = await service.getLocalHistory();
      expect(history).toEqual(mockHistory);
    });
  });

  describe('sync status', () => {
    it('should update sync status after successful sync', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ([])
      }));

      mockChromeStorage.get.mockImplementation((key, callback) => {
        callback({ authToken: 'test-token' });
      });

      await service.sync();

      const status = service.getSyncStatus();
      expect(status.isSyncing).toBe(false);
      expect(status.error).toBeUndefined();
      expect(status.lastSync).toBeInstanceOf(Date);
    });
  });
});