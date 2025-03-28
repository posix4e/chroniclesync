/**
 * Unified test setup file
 */
import '@testing-library/jest-dom';

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  history: {
    search: jest.fn().mockResolvedValue([]),
    getVisits: jest.fn().mockResolvedValue([]),
  },
};

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
};

global.indexedDB = indexedDB;