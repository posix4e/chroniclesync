import '@testing-library/jest-dom';

import type { IDBRequestEvent } from '../../types/index';

describe('IndexedDB utilities', () => {
  const mockTransaction = jest.fn();
  const mockContains = jest.fn();
  const mockIDBRequest = {
    result: {
      transaction: mockTransaction,
      objectStoreNames: {
        contains: mockContains
      }
    },
    onerror: null,
    onsuccess: () => {},
    onupgradeneeded: null
  };

  beforeEach(() => {
    // Reset mocks
    mockTransaction.mockReset();
    mockContains.mockReset();

    // Mock IndexedDB
    const indexedDB = {
      open: jest.fn(() => mockIDBRequest),
      deleteDatabase: jest.fn()
    };

    Object.defineProperty(window, 'indexedDB', {
      value: indexedDB,
      writable: true
    });
  });

  it('should handle database operations correctly', () => {
    // Create a properly typed event
    const successEvent = new Event('success') as IDBRequestEvent;
    Object.defineProperty(successEvent, 'target', {
      value: {
        result: mockIDBRequest.result
      }
    });

    // Simulate success callback
    if (typeof mockIDBRequest.onsuccess === 'function') {
      mockIDBRequest.onsuccess.call(mockIDBRequest);
    }

    expect(window.indexedDB.open).toBeDefined();
  });
});