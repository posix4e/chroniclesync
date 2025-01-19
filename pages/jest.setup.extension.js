// Mock Chrome Extension API
global.chrome = {
  runtime: {
    getManifest: () => ({
      manifest_version: 3,
      version: '1.0'
    }),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};