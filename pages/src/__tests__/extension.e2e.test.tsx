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

// Set up staging environment
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'chroniclesync-pages.dev'
  },
  writable: true
});

describe('Extension E2E Tests', () => {
  beforeEach(() => {
    // Reset all mocks except IndexedDB
    jest.clearAllMocks();

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

    // Verify we're using staging API
    expect(window.location.hostname).toBe('chroniclesync-pages.dev');
  });

  it('should handle data synchronization correctly', async () => {
    // Clean up any existing test databases
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(`sync_test-client`);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });

    // Set up test data
    const testData = {
      key: 'test-key',
      value: 'test-value',
      timestamp: Date.now()
    };

    // Render the app
    render(<App />);

    // Initialize client
    const clientIdInput = screen.getByPlaceholderText('Enter client ID');
    fireEvent.change(clientIdInput, { target: { value: 'test-client' } });
    
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);

    // Wait for initialization and data section
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    });

    // Find and fill the data textarea
    const dataInput = screen.getByRole('textbox', { name: '' });
    fireEvent.change(dataInput, { target: { value: JSON.stringify(testData) } });

    // Save the data
    const saveButton = screen.getByRole('button', { name: 'Save Data' });
    fireEvent.click(saveButton);

    // Wait for success message
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Data saved locally');
    });

    // Sync with server
    const syncButton = screen.getByRole('button', { name: 'Sync with Server' });
    fireEvent.click(syncButton);

    // Wait for sync success message
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Sync successful');
    });
  });

  it('should handle offline mode gracefully', async () => {
    // Clean up any existing test databases
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(`sync_test-client`);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });

    // Set up test data
    const testData = {
      key: 'offline-test',
      value: 'offline-value',
      timestamp: Date.now()
    };

    // Render the app
    render(<App />);

    // Initialize client
    const clientIdInput = screen.getByPlaceholderText('Enter client ID');
    fireEvent.change(clientIdInput, { target: { value: 'test-client' } });
    
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    });

    // Save data locally
    const dataInput = screen.getByRole('textbox', { name: '' });
    fireEvent.change(dataInput, { target: { value: JSON.stringify(testData) } });

    const saveButton = screen.getByRole('button', { name: 'Save Data' });
    fireEvent.click(saveButton);

    // Wait for local save success
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Data saved locally');
    });

    // Try to sync while offline (should fail gracefully)
    const syncButton = screen.getByRole('button', { name: 'Sync with Server' });
    fireEvent.click(syncButton);

    // Wait for sync error message
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Sync error'));
    });

    // Verify data is still accessible locally
    const savedData = await new Promise<any>((resolve, reject) => {
      const db = indexedDB.open(`sync_test-client`, 1);
      db.onerror = () => reject(db.error);
      db.onsuccess = () => {
        const transaction = db.result.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        const request = store.get('userData');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      };
    });

    expect(savedData).toEqual(testData);
  });
});