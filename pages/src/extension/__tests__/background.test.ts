// Mock browser API before any imports
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  history: {
    search: jest.fn(),
    addUrl: jest.fn(),
    onVisited: {
      addListener: jest.fn(),
    },
  },
};

// Mock chrome API
(global as any).chrome = mockChrome;

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