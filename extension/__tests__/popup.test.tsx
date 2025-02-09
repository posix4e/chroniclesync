import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../src/popup';

// Mock Chrome API
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    getBytesInUse: vi.fn(),
    QUOTA_BYTES: 102400,
    MAX_ITEMS: 512,
    MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
    MAX_WRITE_OPERATIONS_PER_MINUTE: 120
  },
  local: {
    get: vi.fn(),
    set: vi.fn((data, callback) => {
      // Trigger storage change event
      const changes: { [key: string]: chrome.storage.StorageChange } = {};
      Object.keys(data).forEach(key => {
        changes[key] = { newValue: data[key], oldValue: undefined };
      });
      mockChromeStorage.onChanged.addListener.mock.calls.forEach(([listener]) => {
        listener(changes, 'local');
      });
      if (callback) callback();
    }),
    remove: vi.fn(),
    clear: vi.fn(),
    getBytesInUse: vi.fn(),
    QUOTA_BYTES: 5242880
  },
  managed: {
    get: vi.fn(),
    getBytesInUse: vi.fn()
  },
  session: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(),
    hasListeners: vi.fn()
  }
};

// Create a complete mock of the chrome API
const mockChrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: null,
    id: 'test-extension-id',
    sendMessage: vi.fn().mockImplementation(
      (
        extensionIdOrMessage: string | { type: string; [key: string]: unknown },
        messageOrCallback: { type: string; [key: string]: unknown } | ((response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void),
        callback?: (response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void
      ) => {
        // Handle both 2-argument and 3-argument versions
        const message = typeof extensionIdOrMessage === 'string' ? messageOrCallback as { type: string } : extensionIdOrMessage as { type: string };
        const responseCallback = typeof extensionIdOrMessage === 'string' 
          ? callback 
          : messageOrCallback as ((response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void);

        if (!responseCallback) {
          return;
        }

        if (message.type === 'getHistoryStatus') {
          responseCallback({ status: 'idle', lastSync: Date.now() });
        } else if (message.type === 'forceSync') {
          responseCallback({ success: true });
        }
      }
    ),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
      hasListeners: vi.fn()
    },
    onConnect: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
      hasListeners: vi.fn()
    }
  }
} as unknown as typeof chrome;

// Set up the global chrome object
global.chrome = mockChrome;

describe('Popup Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Reset mock storage
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ clientId: '', initialized: false, environment: 'production' });
    });
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<App />);
    
    // Check for main elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Client ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    
    // Sync button should not be visible initially
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows sync button after initialization', async () => {
    render(<App />);
    
    // Fill in client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    
    // Click initialize button
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Verify storage was updated
    expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'test-client',
        initialized: true,
        environment: 'production'
      }),
      expect.any(Function)
    );
    
    // Mock storage to return initialized state
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ clientId: 'test-client', initialized: true, environment: 'production' });
    });
    
    // Sync button should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sync with Server' })).toBeInTheDocument();
    });
    
    // Initialize button should be gone
    expect(screen.queryByRole('button', { name: 'Initialize' })).not.toBeInTheDocument();
  });

  it('does not show sync button if client ID is empty', () => {
    render(<App />);
    
    // Click initialize button without entering client ID
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Initialize button should still be there
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    // Sync button should not appear
    expect(screen.queryByRole('button', { name: 'Sync with Server' })).not.toBeInTheDocument();
  });

  it('shows success message after sync', async () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Mock runtime message response
    chrome.runtime.sendMessage = vi.fn().mockImplementation(
      (
        extensionIdOrMessage: string | { type: string; [key: string]: unknown },
        messageOrCallback: { type: string; [key: string]: unknown } | ((response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void),
        callback?: (response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void
      ) => {
        // Handle both 2-argument and 3-argument versions
        const message = typeof extensionIdOrMessage === 'string' ? messageOrCallback as { type: string } : extensionIdOrMessage as { type: string };
        const responseCallback = typeof extensionIdOrMessage === 'string' 
          ? callback 
          : messageOrCallback as ((response: { status?: string; lastSync?: number; success?: boolean; error?: string }) => void);

        if (!responseCallback) {
          return;
        }

        if (message.type === 'forceSync') {
          responseCallback({ success: true });
        }
      }
    );
    
    render(<App />);
    
    // Initialize with client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    
    // Mock storage to return initialized state
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ clientId: 'test-client', initialized: true, environment: 'production' });
    });
    
    // Click sync button
    const syncButton = await screen.findByRole('button', { name: 'Sync with Server' });
    fireEvent.click(syncButton);
    
    // Check if alert was shown
    expect(alertMock).toHaveBeenCalledWith('Sync successful');
    
    // Clean up
    alertMock.mockRestore();
  });

  it('preserves client ID after initialization', async () => {
    // Mock storage to return existing client ID
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ clientId: 'test-client', initialized: true, environment: 'production' });
    });

    render(<App />);
    
    // Client ID should be loaded from storage
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Client ID')).toHaveValue('test-client');
    });
    
    // Change client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'new-client' } });
    
    // Verify storage was updated with new client ID
    await waitFor(() => {
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
        { clientId: 'new-client' },
        expect.any(Function)
      );
    });
  });
});