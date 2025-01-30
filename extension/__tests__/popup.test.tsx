import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../src/popup';

vi.mock('../src/config', () => ({
  config: {
    workerUrl: 'http://localhost:53217'
  }
}));

describe('Popup Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<App />);
    
    // Check for main elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('History Sync')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Client ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    
    // View History button should not be visible initially
    expect(screen.queryByRole('button', { name: 'View History' })).not.toBeInTheDocument();
  });

  it('shows view history button after initialization', async () => {
    // Mock successful client ID verification
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true }));
    (global as any).chrome = {
      runtime: {
        sendMessage: vi.fn((message, callback) => {
          if (message.type === 'SET_CLIENT_ID') {
            callback({ success: true });
          }
        })
      }
    };

    render(<App />);
    
    // Fill in client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    
    // Click initialize button
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // View History button should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View History' })).toBeInTheDocument();
    });
    
    // Initialize button should be gone
    expect(screen.queryByRole('button', { name: 'Initialize' })).not.toBeInTheDocument();
  });

  it('shows error when initializing without client ID', () => {
    render(<App />);
    
    // Click initialize button without entering client ID
    const initButton = screen.getByRole('button', { name: 'Initialize' });
    fireEvent.click(initButton);
    
    // Should show error message
    expect(screen.getByText('Please enter a Client ID')).toBeInTheDocument();
    // Initialize button should still be there
    expect(screen.getByRole('button', { name: 'Initialize' })).toBeInTheDocument();
    // View History button should not appear
    expect(screen.queryByRole('button', { name: 'View History' })).not.toBeInTheDocument();
  });

  it('opens history page when view history is clicked', async () => {
    // Mock successful client ID verification
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true }));
    (global as any).chrome = {
      runtime: {
        sendMessage: vi.fn((message, callback) => {
          if (message.type === 'SET_CLIENT_ID') {
            callback({ success: true });
          }
        })
      },
      tabs: {
        create: vi.fn()
      }
    };
    
    render(<App />);
    
    // Initialize with client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'test-client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    
    // Click View History button
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'View History' }));
    });
    
    // Should open history page
    expect((global as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('/history/test-client')
    });
  });

  it('shows error on initialization failure', async () => {
    // Mock failed client ID verification
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: false }));
    
    render(<App />);
    
    // Try to initialize with invalid client ID
    const input = screen.getByPlaceholderText('Client ID');
    fireEvent.change(input, { target: { value: 'invalid-client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }));
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Invalid Client ID')).toBeInTheDocument();
    });
  });
});