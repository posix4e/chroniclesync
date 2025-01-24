export const mockSendMessage = jest.fn();
export const mockHistory = {
  search: jest.fn(),
  addUrl: jest.fn(),
  deleteUrl: jest.fn(),
  deleteRange: jest.fn(),
  deleteAll: jest.fn(),
  getVisits: jest.fn(),
};
export const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
};

export const mockChrome = {
  runtime: {
    sendMessage: mockSendMessage,
    id: 'test-extension-id',
    getManifest: () => ({
      version: '1.0.0',
      name: 'ChronicleSync',
      manifest_version: 3,
    }),
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
    getPlatformInfo: () => Promise.resolve({ 
      os: 'linux',
      arch: 'x86-64',
      nacl_arch: 'x86-64',
    }),
    connect: () => ({ 
      disconnect: jest.fn(),
      onDisconnect: { addListener: jest.fn() },
      onMessage: { addListener: jest.fn() },
      postMessage: jest.fn(),
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: () => false,
    },
    onConnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: () => false,
    },
  },
  history: mockHistory,
  storage: mockStorage,
} as unknown as typeof chrome;

// Reset all mocks between tests
export const resetMocks = () => {
  jest.clearAllMocks();
  mockSendMessage.mockReset();
  mockHistory.search.mockReset();
  mockHistory.addUrl.mockReset();
  mockStorage.local.get.mockReset();
  mockStorage.local.set.mockReset();
};