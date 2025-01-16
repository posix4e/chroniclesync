// No type imports needed for tests

// Create mock implementations
const mockStorageGet = jest.fn();
const mockStorageSet = jest.fn();
const mockHistorySearch = jest.fn();
const mockHistoryAddUrl = jest.fn();
const mockHistoryOnVisitedAddListener = jest.fn();

// Mock chrome API
const mockChrome = {
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
} as unknown as typeof chrome;

// Add to global scope
(global as typeof global & { chrome: unknown }).chrome = mockChrome;

// Mock the browser-polyfill module
jest.mock('../browser-polyfill.js', () => ({}));

// Import the background script (this should now work with the mocked browser)
import { initialize } from '../background';

describe('Background Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockStorageGet.mockImplementation((_keys, callback) => callback({}));
    mockStorageSet.mockImplementation((_items, callback) => callback());
    mockHistorySearch.mockImplementation((_query, callback) => callback([]));
    mockHistoryAddUrl.mockImplementation((_details, callback) => callback());
  });

  it('should initialize without errors', async () => {
    // Call initialize
    await initialize();
    
    // Verify storage was accessed for initialization
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['clientId', 'lastSync'], expect.any(Function));
  });

  // Add more specific tests for your background script functionality
});