import '@testing-library/jest-dom';

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window functions used in components
window.checkSystemStatus = jest.fn();
window.initializeClient = jest.fn();
window.saveData = jest.fn();
window.loginAdmin = jest.fn();
window.deleteClient = jest.fn();
window.viewClientData = jest.fn();
window.triggerWorkflow = jest.fn();