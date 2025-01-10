// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
};

global.indexedDB = indexedDB;

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;