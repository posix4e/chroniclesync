import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { App } from '../src/popup';
import { EncryptedSyncService } from '../src/services/EncryptedSyncService';

// Mock chrome API
global.chrome = {
  windows: {
    create: vi.fn()
  },
  runtime: {
    getURL: vi.fn(),
    openOptionsPage: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
} as unknown as typeof chrome;

// Mock EncryptedSyncService
vi.mock('../src/services/EncryptedSyncService', () => ({
  EncryptedSyncService: {
    getInstance: vi.fn().mockResolvedValue({
      generateNewSeed: vi.fn().mockResolvedValue('test seed phrase'),
      initializeWithSeed: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset storage mock
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({});
    });
  });

  it('renders encryption setup initially', () => {
    render(<App />);
    
    // Check for encryption setup elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Initialize Encryption' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Existing Seed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate New Seed' })).toBeInTheDocument();
  });

  it('can generate new seed phrase', async () => {
    render(<App />);
    
    // Click generate button
    const generateButton = screen.getByText('Generate New Seed');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    // Should show the generated seed phrase
    expect(screen.getByText('Your new seed phrase is:')).toBeInTheDocument();
    expect(screen.getByText('test seed phrase')).toBeInTheDocument();
  });

  it('can initialize with seed phrase', async () => {
    render(<App />);
    
    // Enter seed phrase
    const textarea = screen.getByPlaceholderText('Enter 12 words separated by spaces');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'test seed phrase' } });
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Initialize Encryption' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should have called initializeWithSeed
    const mockService = await EncryptedSyncService.getInstance();
    expect(mockService.initializeWithSeed).toHaveBeenCalledWith('test seed phrase');
  });

  it('shows client login after encryption setup', async () => {
    // Mock encryption as already initialized
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ encryptionInitialized: true });
    });

    render(<App />);
    
    // Should show client login form
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Client ID')).toBeInTheDocument();
    });
  });

  it('can initialize client after encryption setup', async () => {
    // Mock encryption as already initialized
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ encryptionInitialized: true });
    });

    render(<App />);

    // Enter client ID
    const input = screen.getByPlaceholderText('Client ID');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test-client' } });
    });

    // Click initialize button
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    await act(async () => {
      fireEvent.click(initButton);
    });

    // Should have saved client ID
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'test-client',
        initialized: true
      })
    );
  });

  it('shows sync button after full initialization', async () => {
    // Mock both encryption and client as initialized
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        encryptionInitialized: true,
        initialized: true,
        clientId: 'test-client'
      });
    });

    render(<App />);

    // Should show sync button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sync with Server' })).toBeInTheDocument();
    });
  });

  it('can trigger sync', async () => {
    // Mock both encryption and client as initialized
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        encryptionInitialized: true,
        initialized: true,
        clientId: 'test-client'
      });
    });

    // Mock successful sync
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: true, message: 'Sync successful' });
    });

    render(<App />);

    // Click sync button
    const syncButton = screen.getByRole('button', { name: 'Sync with Server' });
    await act(async () => {
      fireEvent.click(syncButton);
    });

    // Should have sent sync message
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'triggerSync' },
      expect.any(Function)
    );
  });
});