// Mock fetch globally
global.fetch = jest.fn();

// Mock window.location
delete window.location;
window.location = {
  hostname: 'localhost',
  origin: 'http://localhost:5173'
};

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock IndexedDB
const mockIDBRequest = {
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
  result: null,
};

const mockIDBDatabase = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(),
  },
  createObjectStore: jest.fn(),
};

const mockIDBFactory = {
  open: jest.fn().mockReturnValue(mockIDBRequest),
};

global.indexedDB = mockIDBFactory;