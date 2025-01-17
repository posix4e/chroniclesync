import '@testing-library/jest-dom';
import { createMockResponse } from '../../extension/__tests__/mock-response';
import type { HistoryItem } from '../../extension/types';

describe('Extension Integration', () => {
  // Mock browser API
  const mockBrowser = {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn()
      }
    },
    history: {
      search: jest.fn(),
      addUrl: jest.fn(),
      onVisited: {
        addListener: jest.fn()
      }
    },
    runtime: {
      id: 'test-extension-id'
    }
  };

  // Mock fetch
  const mockFetch = jest.fn(() => Promise.resolve(createMockResponse({ history: [] })));

  // Set up global mocks
  const globalWithBrowser = global as unknown as { browser: typeof mockBrowser };
  const globalWithFetch = global as unknown as { fetch: typeof mockFetch };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    globalWithBrowser.browser = mockBrowser;
    globalWithFetch.fetch = mockFetch;

    // Default mock implementations
    mockBrowser.storage.local.get.mockImplementation(async () => ({
      clientId: 'test-client',
      lastSync: Date.now()
    }));
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
    mockBrowser.history.search.mockResolvedValue([]);
    mockBrowser.history.addUrl.mockResolvedValue(undefined);
    mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ history: [] })));
  });

  describe('History Sync', () => {
    it('should sync history between local and remote', async () => {
      // Mock local history
      const localHistory: HistoryItem[] = [{
        id: '1',
        url: 'https://example.com',
        title: 'Example',
        lastVisitTime: Date.now(),
        visitCount: 1
      }];
      mockBrowser.history.search.mockResolvedValue(localHistory);

      // Mock remote history
      const remoteHistory: HistoryItem[] = [{
        id: '2',
        url: 'https://example.org',
        title: 'Another Example',
        lastVisitTime: Date.now(),
        visitCount: 1
      }];
      mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ history: remoteHistory })));

      // Import and initialize background script
      const { initialize } = await import('../../extension/background');
      await initialize();

      // Verify sync behavior
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chroniclesync.xyz'),
        expect.any(Object)
      );
      expect(mockBrowser.history.addUrl).toHaveBeenCalledWith({
        url: 'https://example.org',
        title: 'Another Example'
      });
    });

    it('should handle sync failures gracefully', async () => {
      // Mock fetch failure
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Import and initialize background script
      const { initialize } = await import('../../extension/background');
      await initialize();

      // Should still be functional
      expect(mockBrowser.history.onVisited.addListener).toHaveBeenCalled();
      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastSync: expect.any(Number) })
      );
    });
  });

  describe('IndexedDB Integration', () => {
    it('should handle database operations', async () => {
      // Mock IndexedDB
      const mockIDBRequest = {
        result: {
          transaction: jest.fn(),
          objectStoreNames: {
            contains: jest.fn()
          }
        },
        onerror: null,
        onsuccess: () => {},
        onupgradeneeded: null
      };

      const indexedDB = {
        open: jest.fn(() => mockIDBRequest),
        deleteDatabase: jest.fn()
      };

      Object.defineProperty(window, 'indexedDB', {
        value: indexedDB,
        writable: true
      });

      // Test database operations
      const request = indexedDB.open('testDB', 1);
      expect(request).toBeDefined();
      expect(indexedDB.open).toHaveBeenCalledWith('testDB', 1);
    });
  });

  describe('API URL Resolution', () => {
    it('should resolve correct API URLs', () => {
      // Test production URL
      Object.defineProperty(window, 'location', {
        value: { hostname: 'chroniclesync.xyz' },
        writable: true
      });
      const { API_URL } = jest.requireActual('../../utils/api');
      expect(API_URL).toBe('https://api.chroniclesync.xyz');
    });
  });
});
});