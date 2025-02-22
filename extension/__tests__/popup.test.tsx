import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../src/popup';

// Mock Chrome API
const mockChromeStorage = {
  sync: {
    get: vi.fn((keys, callback) => {
      callback({ clientId: '', initialized: false });
    }),
    set: vi.fn((data, callback) => {
      if (callback) callback();
    })
  }
};

// Create a complete mock of the chrome API
const mockChrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: null,
    sendMessage: vi.fn((message, callback) => {
      if (message.type === 'getHistory') {
        callback([]);
      } else if (message.type === 'triggerSync') {
        callback({ success: true });
      }
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    openOptionsPage: vi.fn()
  }
} as unknown as typeof chrome;

// Set up the global chrome object
global.chrome = mockChrome;

describe('Popup Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Reset mock storage
    mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
      callback({ clientId: '', initialized: false });
    });
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  it('renders initial state correctly', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Check for main elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Client ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    
    // Sync button should not be visible initially
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows sync button after initialization', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Fill in client ID
    const input = screen.getByPlaceholderText('Client ID');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test-client' } });
    });
    
    // Click initialize button
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    await act(async () => {
      fireEvent.click(initButton);
    });
    
    // Verify storage was updated
    expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'test-client',
        initialized: true
      }),
      expect.any(Function)
    );
    
    // Mock storage to return initialized state
    mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
      callback({ clientId: 'test-client', initialized: true });
    });
    
    // Sync button should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sync with Server' })).toBeInTheDocument();
    });
    
    // Initialize button should be gone
    expect(screen.queryByRole('button', { name: 'Initialize' })).not.toBeInTheDocument();
  });

  it('does not show sync button if client ID is empty', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Click initialize button without entering client ID
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    await act(async () => {
      fireEvent.click(initButton);
    });
    
    // Initialize button should still be there
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    // Sync button should not appear
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows success message after sync', async () => {
    // Mock window.alert and chrome.runtime.sendMessage
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    interface SyncMessage {
      type: 'triggerSync';
    }
    interface SyncResponse {
      success: boolean;
      error?: string;
    }
    const sendMessageMock = vi.fn((
      message: SyncMessage,
      responseCallback?: (response: SyncResponse) => void
    ) => {
      if (responseCallback) {
        responseCallback({ success: true });
      }
    });
    mockChrome.runtime.sendMessage = sendMessageMock as unknown as typeof mockChrome.runtime.sendMessage;
    
    await act(async () => {
      render(<App />);
    });
    
    // Initialize with client ID
    const input = screen.getByPlaceholderText('Client ID');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test-client' } });
      fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    });
    
    // Click sync button
    const syncButton = await screen.findByRole('button', { name: 'Sync with Server' });
    await act(async () => {
      fireEvent.click(syncButton);
    });
    
    // Check if message was sent and alert was shown
    expect(sendMessageMock).toHaveBeenCalledWith(
      { type: 'triggerSync' },
      expect.any(Function)
    );
    expect(alertMock).toHaveBeenCalledWith('Sync successful');
    
    // Clean up
    alertMock.mockRestore();
  });

  it('preserves client ID after initialization', async () => {
    // Mock storage to return existing client ID
    mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
      callback({ clientId: 'test-client', initialized: true });
    });

    await act(async () => {
      render(<App />);
    });
    
    // Client ID should be loaded from storage
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Client ID')).toHaveValue('test-client');
    });
    
    // Change client ID
    const input = screen.getByPlaceholderText('Client ID');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'new-client' } });
    });
    
    // Verify storage was updated with new client ID
    await waitFor(() => {
      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { clientId: 'new-client' },
        expect.any(Function)
      );
    });
  });
});