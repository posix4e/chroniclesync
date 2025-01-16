// Import types
import type { StorageData } from '../types';

// Mock browser API before any imports
const mockChrome: Partial<typeof chrome> = {
  storage: {
    local: {
      get: jest.fn<void, [{ [key: string]: unknown }, (_result: StorageData) => void]>(),
      set: jest.fn<void, [{ [key: string]: unknown }, () => void]>(),
    },
  },
  history: {
    search: jest.fn<void, [chrome.history.HistoryQuery, (_results: chrome.history.HistoryItem[]) => void]>(),
    addUrl: jest.fn<void, [chrome.history.HistoryUrlDetails, () => void]>(),
    onVisited: {
      addListener: jest.fn<void, [(_result: chrome.history.HistoryItem) => void]>(),
    },
  },
};

// Mock chrome API
(globalThis as typeof global & { chrome: typeof chrome }).chrome = mockChrome;

// Mock the browser-polyfill module
jest.mock('../browser-polyfill.js', () => ({}));

// Import the background script (this should now work with the mocked browser)
import { initialize } from '../background';

describe('Background Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockChrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
    mockChrome.storage.local.set.mockImplementation((items, callback) => callback());
    mockChrome.history.search.mockImplementation((query, callback) => callback([]));
    mockChrome.history.addUrl.mockImplementation((details, callback) => callback());
  });

  it('should initialize without errors', async () => {
    // Call initialize
    await initialize();
    
    // Verify storage was accessed for initialization
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['clientId', 'lastSync'], expect.any(Function));
  });

  // Add more specific tests for your background script functionality
});