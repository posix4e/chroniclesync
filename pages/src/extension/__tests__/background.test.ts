// Mock browser polyfill first
jest.mock('../browser-polyfill.js', () => {});

// Set test environment
process.env.NODE_ENV = 'test';

// Import the module under test
let initialize: typeof import('../background').initialize;
let storageGet: typeof import('../background').storageGet;
let storageSet: typeof import('../background').storageSet;

// Import test helpers
import { createMockResponse } from './mock-response';
import type { HistoryItem } from '../types';

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

// Helper function to wait for async operations
const waitForAsync = async (condition: () => boolean | Promise<boolean>, timeout = 2000): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

// Helper function to initialize and wait
const initializeAndWait = async (): Promise<void> => {
  try {
    const initPromise = initialize();
    
    // Wait for storage operations to complete
    await waitForAsync(async () => {
      const calls = mockBrowser.storage.local.get.mock.calls.length;
      return calls > 0;
    });
    
    await initPromise;
    
    // Wait for history listener to be set up
    await waitForAsync(() => 
      mockBrowser.history.onVisited.addListener.mock.calls.length > 0
    );
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  }
};

describe('Background Script', () => {

  // Mock fetch with proper response structure
  const mockFetch = jest.fn(() => Promise.resolve(createMockResponse({ history: [] })));

  // Mock global objects
  const globalWithBrowser = global as unknown as { browser: typeof mockBrowser };
  const globalWithFetch = global as unknown as { fetch: typeof mockFetch };
  globalWithBrowser.browser = mockBrowser;
  globalWithFetch.fetch = mockFetch;

  beforeEach(async () => {
    // Reset module state
    jest.resetModules();
    const module = await import('../background');
    initialize = module.initialize;
    storageGet = module.storageGet;
    storageSet = module.storageSet;

    // Clear all mocks
    jest.clearAllMocks();
    mockBrowser.storage.local.get.mockReset();
    mockBrowser.storage.local.set.mockReset();
    mockBrowser.history.search.mockReset();
    mockBrowser.history.addUrl.mockReset();
    mockBrowser.history.onVisited.addListener.mockReset();
    mockFetch.mockReset();

    // Set up global mocks
    const globalWithBrowser = global as unknown as { browser: typeof mockBrowser };
    const globalWithFetch = global as unknown as { fetch: typeof mockFetch };
    globalWithBrowser.browser = mockBrowser;
    globalWithFetch.fetch = mockFetch;

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
    mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ history: [] })));
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
      mockBrowser.storage.local.get.mockImplementation(async () => ({}));
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
      mockBrowser.storage.local.get.mockImplementation(async () => ({
        clientId: 'existing-123',
        lastSync: 1234567890
      }));

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
      mockBrowser.storage.local.get.mockImplementation(async () => ({
        clientId: 'test-123',
        lastSync: 1234567890
      }));
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('should sync local history with remote', async () => {
      // Mock local history
      const localHistory: HistoryItem[] = [{
        id: '1',
        url: 'https://example.com',
        title: 'Example',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      mockBrowser.history.search.mockResolvedValue(localHistory);

      // Mock remote history
      const remoteHistory: HistoryItem[] = [{
        id: '2',
        url: 'https://example.org',
        title: 'Another Example',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ history: remoteHistory })));

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
      // Mock existing client ID to avoid initialization errors
      mockBrowser.storage.local.get.mockImplementation(async () => ({
        clientId: 'test-123',
        lastSync: 1234567890
      }));

      // Mock a failed fetch
      mockFetch.mockRejectedValue(new Error('Network error'));

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
      const localHistory: HistoryItem[] = [{
        id: '1',
        url: 'https://example.com',
        title: 'Example (Local)',
        lastVisitTime: 1234567890,
        visitCount: 1
      }];
      const remoteHistory: HistoryItem[] = [{
        id: '2',
        url: 'https://example.com',
        title: 'Example (Remote)',
        lastVisitTime: 1234567800,
        visitCount: 2
      }];

      mockBrowser.history.search.mockResolvedValue(localHistory);
      mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ history: remoteHistory })));

      // Initialize and wait for sync
      await initializeAndWait();

      // Get the last POST request
      const postCalls = mockFetch.mock.calls
        .map((call: unknown[]) => {
          if (!Array.isArray(call) || call.length < 2) return null;
          const init = call[1];
          if (typeof init !== 'object' || init === null) return null;
          if (!('method' in init) || !('body' in init)) return null;
          return init as { method: string; body: string };
        })
        .filter((init): init is { method: string; body: string } => 
          init !== null && init.method === 'POST'
        );
      expect(postCalls.length).toBeGreaterThan(0);

      // Should use local version for overlapping URLs
      const lastPostCall = postCalls[postCalls.length - 1];
      const syncedData = lastPostCall ? JSON.parse(lastPostCall.body) : null;
      expect(syncedData.history).toContainEqual(expect.objectContaining({
        url: 'https://example.com',
        title: 'Example (Local)'
      }));
    });
  });
});