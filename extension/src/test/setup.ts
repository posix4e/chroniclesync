// @ts-nocheck - Disable TypeScript checking for this file
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * Consolidated test setup file for ChronicleSync extension
 * - Sets up testing library
 * - Mocks Chrome Extension API
 * - Provides test utilities
 */

// Create a simplified mock of Chrome API for testing
// This avoids TypeScript errors while providing the functionality we need
const createMockChromeAPI = () => {
  // Create a basic event implementation
  const createChromeEvent = () => {
    const listeners: Function[] = [];
    return {
      addListener: vi.fn((callback: Function) => listeners.push(callback)),
      removeListener: vi.fn((callback: Function) => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }),
      hasListener: vi.fn((callback: Function) => listeners.includes(callback)),
      hasListeners: vi.fn(() => listeners.length > 0),
      getRules: vi.fn(),
      addRules: vi.fn(),
      removeRules: vi.fn()
    };
  };

  // Create a storage area implementation
  const createStorageArea = () => {
    const data: Record<string, any> = {};
    return {
      get: vi.fn((keys, callback) => {
        let result: Record<string, any> = {};
        
        if (!keys) {
          result = { ...data };
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (data[key] !== undefined) result[key] = data[key];
          });
        } else if (typeof keys === 'string') {
          if (data[keys] !== undefined) result[keys] = data[keys];
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = data[key] !== undefined ? data[key] : keys[key];
          });
        }
        
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: vi.fn((items, callback) => {
        Object.assign(data, items);
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      onChanged: createChromeEvent()
    };
  };

  // Return the mock Chrome API
  return {
    runtime: {
      getManifest: vi.fn(() => ({
        manifest_version: 3,
        version: '1.0',
        name: 'ChronicleSync Extension'
      })),
      sendMessage: vi.fn(),
      onMessage: createChromeEvent(),
      getURL: vi.fn((path) => `chrome-extension://mock-extension-id/${path}`),
      openOptionsPage: vi.fn(),
      lastError: null
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
      onUpdated: createChromeEvent(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      get: vi.fn()
    },
    storage: {
      local: createStorageArea(),
      sync: createStorageArea(),
      onChanged: createChromeEvent()
    },
    history: {
      search: vi.fn(),
      getVisits: vi.fn(),
      addUrl: vi.fn(),
      deleteUrl: vi.fn(),
      deleteRange: vi.fn(),
      deleteAll: vi.fn(),
      onVisited: createChromeEvent(),
      onVisitRemoved: createChromeEvent()
    },
    windows: {
      create: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      getCurrent: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      onCreated: createChromeEvent(),
      onRemoved: createChromeEvent(),
      onFocusChanged: createChromeEvent()
    }
  };
};

// Set up the mock Chrome API
global.chrome = createMockChromeAPI();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Test utilities
export const mockChromeAPI = {
  // Helper to simulate chrome.runtime.sendMessage response
  mockSendMessageResponse: (response: any) => {
    vi.mocked(chrome.runtime.sendMessage).mockImplementation(
      (message, responseCallback) => {
        if (responseCallback && typeof responseCallback === 'function') {
          responseCallback(response);
        }
        return true;
      }
    );
  },
  
  // Helper to simulate chrome.storage.local.get response
  mockStorageLocalGet: (data: Record<string, any>) => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      (keys, callback) => {
        if (callback && typeof callback === 'function') {
          callback(data);
        }
        return Promise.resolve(data);
      }
    );
  },
  
  // Helper to simulate chrome.storage.sync.get response
  mockStorageSyncGet: (data: Record<string, any>) => {
    vi.mocked(chrome.storage.sync.get).mockImplementation(
      (keys, callback) => {
        if (callback && typeof callback === 'function') {
          callback(data);
        }
        return Promise.resolve(data);
      }
    );
  }
};