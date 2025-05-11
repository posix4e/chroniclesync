import { vi } from 'vitest';

// Mock Chrome Extension API
global.chrome = {
  runtime: {
    getManifest: () => ({
      manifest_version: 3,
      version: '1.0'
    }),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    },
    getURL: vi.fn((path) => `chrome-extension://mock-extension-id/${path}`)
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    },
    sync: {
      get: vi.fn((keys, callback) => callback({})),
      set: vi.fn((data, callback) => callback())
    }
  }
};