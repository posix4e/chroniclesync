// Mock browser polyfill first
jest.mock('../browser-polyfill.js', () => ({}));

// Import the module under test
import { initialize, storageGet, storageSet } from '../background';

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
  }
};

// Mock browser global
(global as any).browser = mockBrowser;

// Mock fetch with proper response structure
const mockFetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({ history: [] })
  })
);
(global as any).fetch = mockFetch;

describe('Background Script', () => {
  beforeEach(() => {
    // Reset module state
    jest.resetModules();

    // Clear all mocks
    jest.clearAllMocks();
    mockBrowser.storage.local.get.mockReset();
    mockBrowser.storage.local.set.mockReset();
    mockBrowser.history.search.mockReset();
    mockBrowser.history.addUrl.mockReset();
    mockBrowser.history.onVisited.addListener.mockReset();
    mockFetch.mockReset();

    // Default mock implementations
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
    mockBrowser.history.search.mockResolvedValue([]);
    mockBrowser.history.addUrl.mockResolvedValue(undefined);
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ history: [] })
      })
    );
  });

  describe('Storage Operations', () => {
    it('should get data from storage', async () => {
      const mockData = { clientId: 'test-123' };
      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await storageGet(['clientId']);
      expect(result).toEqual(mockData);
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['clientId']);
    });

    it('should set data in storage', async () => {
      const mockData = { clientId: 'test-123' };
      await storageSet(mockData);
      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Initialization', () => {
    let originalDateNow: typeof Date.now;
    let originalMathRandom: typeof Math.random;

    beforeEach(() => {
      // Mock Date.now and Math.random for consistent testing
      originalDateNow = Date.now;
      originalMathRandom = Math.random;
      Date.now = jest.fn(() => 1234567890);
      Math.random = jest.fn(() => 0.123456789);
    });

    afterEach(() => {
      // Restore original functions
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });

    it('should generate a new client ID if none exists', async () => {
      // Mock empty storage
      mockBrowser.storage.local.get.mockResolvedValue({});

      // Initialize and wait for storage operations
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async operations complete

      // Verify storage operations
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['clientId', 'lastSync']);
      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        clientId: expect.stringMatching(/^browser_1234567890_.*/)
      });
    });

    it('should use existing client ID if available', async () => {
      // Mock existing client ID
      mockBrowser.storage.local.get.mockResolvedValue({
        clientId: 'existing-123',
        lastSync: 1234567890
      });

      // Initialize and wait for storage operations
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async operations complete

      // Verify storage operations
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['clientId', 'lastSync']);
      expect(mockBrowser.storage.local.set).not.toHaveBeenCalledWith(
        expect.objectContaining({ clientId: expect.any(String) })
      );
    });

    it('should set up history sync listener', async () => {
      // Mock storage to avoid initialization issues
      mockBrowser.storage.local.get.mockResolvedValue({
        clientId: 'test-123',
        lastSync: 1234567890
      });

      // Initialize and wait for all async operations
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0)); // Let async operations complete

      // Verify listener setup
      expect(mockBrowser.history.onVisited.addListener).toHaveBeenCalled();
    });
  });

  describe('History Sync', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      // Mock storage with test client ID
      mockBrowser.storage.local.get.mockImplementation(async (keys: string[]) => {
        if (keys.includes('clientId')) {
          return {
            clientId: 'test-123',
            lastSync: 1234567890
          };
        }
        return {};
      });

      // Mock console.error
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('should sync local history with remote', async () => {
      // Mock local history
      const localHistory = [{
        id: '1',
        url: 'https://example.com',
        title: 'Example',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      mockBrowser.history.search.mockResolvedValue(localHistory);

      // Mock remote history
      const remoteHistory = [{
        id: '2',
        url: 'https://example.org',
        title: 'Another Example',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          json: () => Promise.resolve({ history: remoteHistory })
        })
      );

      // Initialize and wait for sync
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should fetch remote history
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.chroniclesync.xyz'),
        expect.any(Object)
      );

      // Should add remote history to local
      expect(mockBrowser.history.addUrl).toHaveBeenCalledWith({
        url: 'https://example.org',
        title: 'Another Example'
      });

      // Should not have any errors
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('should handle sync failures gracefully', async () => {
      // Mock a failed fetch
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      // Initialize and wait for sync
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should log the error
      expect(consoleError).toHaveBeenCalledWith(
        'Error syncing history:',
        expect.any(Error)
      );

      // Should still set up event listeners
      expect(mockBrowser.history.onVisited.addListener).toHaveBeenCalled();

      // Should continue working after error
      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastSync: expect.any(Number) })
      );
    });

    it('should merge local and remote history correctly', async () => {
      // Mock overlapping history items
      const localHistory = [{
        id: '1',
        url: 'https://example.com',
        title: 'Example (Local)',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      const remoteHistory = [{
        id: '2',
        url: 'https://example.com',
        title: 'Example (Remote)',
        lastVisitTime: 1234567800,
        visitCount: 2
      }];

      mockBrowser.history.search.mockResolvedValue(localHistory);
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          json: () => Promise.resolve({ history: remoteHistory })
        })
      );

      // Initialize and wait for sync
      await initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should use local version for overlapping URLs
      const syncedData = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(syncedData.history).toContainEqual(expect.objectContaining({
        url: 'https://example.com',
        title: 'Example (Local)'
      }));
    });
  });
});