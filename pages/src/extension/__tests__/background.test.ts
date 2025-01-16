// Import types
import type { HistoryItem, StorageData } from '../types';

// Create mock implementations
const mockStorageGet = jest.fn();
const mockStorageSet = jest.fn();
const mockHistorySearch = jest.fn();
const mockHistoryAddUrl = jest.fn();
const mockHistoryOnVisitedAddListener = jest.fn();

// Mock browser API
const mockBrowser = {
  storage: {
    local: {
      get: mockStorageGet,
      set: mockStorageSet,
    },
  },
  history: {
    search: mockHistorySearch,
    addUrl: mockHistoryAddUrl,
    onVisited: {
      addListener: mockHistoryOnVisitedAddListener,
    },
  },
};

// Add to global scope
(global as typeof global & { browser: unknown }).browser = mockBrowser;

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({ history: [] })
});

// Mock the browser-polyfill module
jest.mock('../browser-polyfill.js', () => ({}));

// Import the background script (this should now work with the mocked browser)
import { initialize, storageGet } from '../background';

describe('Background Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockStorageGet.mockResolvedValue({
      clientId: 'test_client',
      lastSync: Date.now()
    });
    mockStorageSet.mockResolvedValue(undefined);
    mockHistorySearch.mockResolvedValue([{
      id: '1',
      url: 'https://example.com',
      title: 'Example',
      lastVisitTime: Date.now(),
      visitCount: 1
    }]);
    mockHistoryAddUrl.mockResolvedValue(undefined);
  });

  it('should initialize without errors', async () => {
    // Call initialize
    await initialize();
    
    // Call storageGet directly to verify it works
    const storage = await storageGet(['clientId', 'lastSync']);
    expect(storage).toEqual({
      clientId: 'test_client',
      lastSync: expect.any(Number)
    });
  });

  // Add more specific tests for your background script functionality
});