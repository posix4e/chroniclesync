import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Popup } from '../popup';

// Mock chrome.runtime.sendMessage
// Mock only the parts of chrome API we use
global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
} as unknown as typeof chrome;

describe('Popup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<Popup />);
    
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('Last sync: Never')).toBeInTheDocument();
    expect(screen.getByText('Status: idle')).toBeInTheDocument();
    expect(screen.getByText('Sync Now')).toBeEnabled();
  });

  it('handles successful sync', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<Popup />);
    
    const syncButton = screen.getByText('Sync Now');
    await act(async () => {
      fireEvent.click(syncButton);
    });
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'sync' });
    expect(screen.getByText(/Last sync:/)).not.toHaveTextContent('Never');
    expect(screen.getByText('Status: idle')).toBeInTheDocument();
  });

  it('handles sync failure', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: false });
    
    render(<Popup />);
    
    const syncButton = screen.getByText('Sync Now');
    await act(async () => {
      fireEvent.click(syncButton);
    });
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'sync' });
    expect(screen.getByText('Status: error')).toBeInTheDocument();
  });

  it('handles sync error', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<Popup />);
    
    const syncButton = screen.getByText('Sync Now');
    await act(async () => {
      fireEvent.click(syncButton);
    });
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'sync' });
    expect(screen.getByText('Status: error')).toBeInTheDocument();
  });

  it('disables sync button while syncing', async () => {
    // Use a promise that won't resolve immediately to keep the syncing state
    let resolveSync: (_: { success: boolean }) => void;
    const syncPromise = new Promise<{ success: boolean }>(resolve => {
      resolveSync = resolve;
    });
    (chrome.runtime.sendMessage as jest.Mock).mockReturnValueOnce(syncPromise);
    
    render(<Popup />);
    
    const syncButton = screen.getByText('Sync Now');
    await act(async () => {
      fireEvent.click(syncButton);
    });
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.getByText('Syncing...')).toBeDisabled();
    
    // Resolve the sync
    await act(async () => {
      resolveSync!({ success: true });
    });
    
    expect(screen.getByText('Sync Now')).toBeEnabled();
  });
});