import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import React from 'react';
import { DB } from '../utils/db';

// Mock chrome.runtime.sendMessage
const mockSendMessage = jest.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: jest.fn()
    }
  }
} as any;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock IndexedDB
const mockIDBOpen = jest.fn();
const mockIDBTransaction = jest.fn();
const mockIDBObjectStore = jest.fn();
const mockIDBPut = jest.fn();
const mockIDBGet = jest.fn();

const indexedDB = {
  open: mockIDBOpen,
  deleteDatabase: jest.fn()
};

describe('Extension E2E Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup IndexedDB mock
    const mockDB = {
      createObjectStore: jest.fn().mockReturnValue({
        put: mockIDBPut,
        get: mockIDBGet
      }),
      transaction: mockIDBTransaction.mockReturnValue({
        objectStore: mockIDBObjectStore.mockReturnValue({
          put: mockIDBPut,
          get: mockIDBGet
        })
      })
    };

    mockIDBOpen.mockImplementation(() => {
      const request = {
        result: mockDB,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => request.onsuccess?.({} as any), 0);
      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      value: indexedDB,
      writable: true
    });

    // Setup fetch mock default response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ healthy: true })
    });

    // Setup chrome message mock default response
    mockSendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    // Mock window.alert
    const mockAlert = jest.fn();
    Object.defineProperty(window, 'alert', {
      writable: true,
      value: mockAlert
    });

    // Spy on console to catch warnings and errors
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Verify no warnings or errors were logged
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should load extension and perform health check without errors', async () => {
    // Render the app
    render(<App />);

    // Verify initial load
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();

    // Perform health check
    const checkButton = screen.getByRole('button', { name: 'Check Health' });
    fireEvent.click(checkButton);

    // Wait for health check response
    await waitFor(() => {
      expect(screen.getByText('✅ Healthy')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle data synchronization correctly', async () => {
    // Mock sync data
    const testData = {
      key: 'test-key',
      value: 'test-value',
      timestamp: Date.now()
    };

    // Setup IndexedDB mock response
    mockIDBGet.mockImplementation((key) => {
      const request = {
        result: testData,
        onsuccess: null,
        onerror: null
      };
      setTimeout(() => request.onsuccess?.({} as any), 0);
      return request;
    });

    // Mock DB instance
    jest.spyOn(DB.prototype, 'init').mockResolvedValue();
    jest.spyOn(DB.prototype, 'setData').mockResolvedValue();
    jest.spyOn(DB.prototype, 'getData').mockResolvedValue(testData);

    // Render the app
    render(<App />);

    // Initialize client
    const clientIdInput = screen.getByPlaceholderText('Enter client ID');
    fireEvent.change(clientIdInput, { target: { value: 'test-client' } });
    
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);

    // Wait for initialization
    await waitFor(() => {
      expect(DB.prototype.init).toHaveBeenCalledWith('test-client');
    });

    // Wait for data section to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    });

    // Find and fill the data textarea
    const dataInput = screen.getByRole('textbox', { name: '' });
    fireEvent.change(dataInput, { target: { value: JSON.stringify(testData) } });

    // Save the data
    const saveButton = screen.getByRole('button', { name: 'Save Data' });
    fireEvent.click(saveButton);

    // Wait for data to be saved
    await waitFor(() => {
      expect(DB.prototype.setData).toHaveBeenCalledWith(testData);
    });
  });

  it('should handle offline mode gracefully', async () => {
    // Mock fetch to simulate offline
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Mock DB instance
    const testData = {
      key: 'offline-test',
      value: 'offline-value',
      timestamp: Date.now()
    };
    jest.spyOn(DB.prototype, 'getData').mockResolvedValue(testData);

    // Render the app
    render(<App />);

    // Perform health check
    const checkButton = screen.getByRole('button', { name: 'Check Health' });
    fireEvent.click(checkButton);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('❌ Error')).toBeInTheDocument();
    });

    // Initialize client and verify data is still accessible
    const clientIdInput = screen.getByPlaceholderText('Enter client ID');
    fireEvent.change(clientIdInput, { target: { value: 'test-client' } });
    
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);

    // Wait for data section to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    });

    // Verify data is displayed
    const dataInput = screen.getByRole('textbox', { name: '' });
    expect(dataInput).toHaveValue(JSON.stringify(testData, null, 2));
  });
});