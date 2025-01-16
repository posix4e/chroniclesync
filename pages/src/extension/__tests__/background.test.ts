// Mock browser polyfill first
jest.mock('../browser-polyfill.js', () => {});

// Set test environment
process.env.NODE_ENV = 'test';

// Import the module under test
import { initialize, storageGet, storageSet, syncHistory } from '../background';

// Helper function to wait for async operations
const waitForAsync = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to initialize and wait
const initializeAndWait = async () => {
  const initPromise = initialize().catch(error => {
    console.error('Initialization failed:', error);
    throw error;
  });
  await waitForAsync();
  await initPromise;
};

describe('Background Script', () => {
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

  // Mock fetch with proper response structure
  const mockFetch = jest.fn(() => 
    Promise.resolve({
      json: () => Promise.resolve({ history: [] })
    })
  );

  // Define global types
  declare global {
    var browser: typeof mockBrowser;
    var fetch: typeof mockFetch;
  }

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
    mockBrowser.storage.local.get.mockImplementation(async (keys: string[]) => {
      if (keys.includes('clientId')) {
        return {
          clientId: 'test-123',
          lastSync: 1234567890
        };
      }
      return {};
    });
    mockBrowser.storage.local.set.mockResolvedValue(undefined);
    mockBrowser.history.search.mockResolvedValue([]);
    mockBrowser.history.addUrl.mockResolvedValue(undefined);
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ history: [] })
      })
    );

    // Set up global mocks
    global.browser = mockBrowser;
    global.fetch = mockFetch;
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

      // Mock empty storage for initialization tests
      mockBrowser.storage.local.get.mockResolvedValue({});
    });

    afterEach(() => {
      // Restore original functions
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });

    it('should generate a new client ID if none exists', async () => {
      // Initialize and wait for storage operations
      await initializeAndWait();

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
      await initializeAndWait();

      // Verify storage operations
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['clientId', 'lastSync']);
      expect(mockBrowser.storage.local.set).not.toHaveBeenCalledWith(
        expect.objectContaining({ clientId: expect.any(String) })
      );
    });

    it('should set up history sync listener', async () => {
      // Initialize and wait for all async operations
      await initializeAndWait();

      // Verify listener setup
      expect(mockBrowser.history.onVisited.addListener).toHaveBeenCalled();
    });
  });

  describe('History Sync', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      // Mock console.error
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

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
      await initializeAndWait();

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
      await initializeAndWait();

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
      await initializeAndWait();

      // Get the last POST request
      const postCalls = mockFetch.mock.calls.filter(call => call[1]?.method === 'POST');
      expect(postCalls.length).toBeGreaterThan(0);

      // Should use local version for overlapping URLs
      const lastPostCall = postCalls[postCalls.length - 1];
      const syncedData = JSON.parse(lastPostCall[1].body);
      expect(syncedData.history).toContainEqual(expect.objectContaining({
        url: 'https://example.com',
        title: 'Example (Local)'
      }));
    });
  });
});