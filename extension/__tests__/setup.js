import { vi } from 'vitest';

// Mock chrome API
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn()
    }
  },
  tabs: {
    onUpdated: {
      addListener: vi.fn()
    }
  }
};

// Mock fetch API
const mockFetch = vi.fn();

// Export mocks
export { mockChrome, mockFetch };