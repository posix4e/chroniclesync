import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Popup } from '../src/popup';

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
    render(<Popup />);
    
    // Check for main elements
    expect(screen.getByText('ChronicleSync')).toBeInTheDocument();
    expect(screen.getByText('Last sync: Never')).toBeInTheDocument();
    expect(screen.getByText('Status: idle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync Now' })).toBeInTheDocument();
  });

  it('shows syncing state while syncing', async () => {
    // Mock chrome.runtime.sendMessage
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))),
        connect: vi.fn(),
        connectNative: vi.fn(),
        getBackgroundPage: vi.fn(),
        getContexts: vi.fn(),
        getManifest: vi.fn(),
        getPackageDirectoryEntry: vi.fn(),
        getPlatformInfo: vi.fn(),
        getURL: vi.fn(),
        reload: vi.fn(),
        requestUpdateCheck: vi.fn(),
        restart: vi.fn(),
        restartAfterDelay: vi.fn(),
        sendNativeMessage: vi.fn(),
        setUninstallURL: vi.fn(),
        openOptionsPage: vi.fn(),
        id: 'test-extension-id'
      } as unknown as typeof chrome.runtime
    } as unknown as typeof chrome;

    render(<Popup />);
    
    // Click sync button
    const syncButton = screen.getByRole('button', { name: 'Sync Now' });
    fireEvent.click(syncButton);
    
    // Button should show syncing state
    expect(screen.getByRole('button', { name: 'Syncing...' })).toBeInTheDocument();
    expect(screen.getByText('Status: syncing')).toBeInTheDocument();
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sync Now' })).toBeInTheDocument();
      expect(screen.getByText('Status: idle')).toBeInTheDocument();
    });
  });

  it('shows error state on sync failure', async () => {
    // Mock chrome.runtime.sendMessage with error
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockRejectedValue(new Error('Sync failed')),
        connect: vi.fn(),
        connectNative: vi.fn(),
        getBackgroundPage: vi.fn(),
        getContexts: vi.fn(),
        getManifest: vi.fn(),
        getPackageDirectoryEntry: vi.fn(),
        getPlatformInfo: vi.fn(),
        getURL: vi.fn(),
        reload: vi.fn(),
        requestUpdateCheck: vi.fn(),
        restart: vi.fn(),
        restartAfterDelay: vi.fn(),
        sendNativeMessage: vi.fn(),
        setUninstallURL: vi.fn(),
        openOptionsPage: vi.fn(),
        id: 'test-extension-id'
      } as unknown as typeof chrome.runtime
    } as unknown as typeof chrome;

    render(<Popup />);
    
    // Click sync button
    const syncButton = screen.getByRole('button', { name: 'Sync Now' });
    fireEvent.click(syncButton);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Status: error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sync Now' })).toBeInTheDocument();
    });
  });

  it('updates last sync time after successful sync', async () => {
    // Mock chrome.runtime.sendMessage
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
        connect: vi.fn(),
        connectNative: vi.fn(),
        getBackgroundPage: vi.fn(),
        getContexts: vi.fn(),
        getManifest: vi.fn(),
        getPackageDirectoryEntry: vi.fn(),
        getPlatformInfo: vi.fn(),
        getURL: vi.fn(),
        reload: vi.fn(),
        requestUpdateCheck: vi.fn(),
        restart: vi.fn(),
        restartAfterDelay: vi.fn(),
        sendNativeMessage: vi.fn(),
        setUninstallURL: vi.fn(),
        openOptionsPage: vi.fn(),
        id: 'test-extension-id'
      } as unknown as typeof chrome.runtime
    } as unknown as typeof chrome;

    render(<Popup />);
    
    // Get initial last sync time
    expect(screen.getByText('Last sync: Never')).toBeInTheDocument();
    
    // Click sync button
    const syncButton = screen.getByRole('button', { name: 'Sync Now' });
    fireEvent.click(syncButton);
    
    // Wait for sync to complete and check last sync time was updated
    await waitFor(() => {
      expect(screen.queryByText('Last sync: Never')).not.toBeInTheDocument();
      expect(screen.getByText(/Last sync: .+/)).toBeInTheDocument();
    });
  });
});