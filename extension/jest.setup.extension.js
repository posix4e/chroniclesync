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
    }
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};