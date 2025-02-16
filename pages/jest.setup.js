import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

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
const mockFunctions = {
  checkSystemStatus: jest.fn(),
  initializeClient: jest.fn(),
  saveData: jest.fn(),
  loginAdmin: jest.fn(),
  deleteClient: jest.fn(),
  viewClientData: jest.fn(),
  triggerWorkflow: jest.fn(),
};

Object.entries(mockFunctions).forEach(([key, value]) => {
  Object.defineProperty(window, key, {
    value,
    writable: true,
    configurable: true,
  });
});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;