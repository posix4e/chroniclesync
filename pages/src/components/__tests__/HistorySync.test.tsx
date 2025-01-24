import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistorySync } from '../HistorySync';
import { mockChrome, mockSendMessage, mockHistory, resetMocks } from './mocks/chrome';
import { mockDeviceInfo, mockHistoryItems } from './fixtures/history';

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

global.chrome = {
  ...mockChrome,
  history: mockHistory
};

describe('HistorySync', () => {
  const deviceId = mockDeviceInfo.id;

  beforeEach(() => {
    resetMocks();
    jest.useFakeTimers();
    mockHistory.search.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with device ID and initial empty state', () => {
    render(<HistorySync deviceId={deviceId} />);
    expect(screen.getByText(`Device ID: ${deviceId}`)).toBeInTheDocument();
    expect(screen.getByText('Sync History')).toBeInTheDocument();
    expect(screen.getByText('No history items found')).toBeInTheDocument();
  });

  it('handles successful sync with history items', async () => {
    mockSendMessage.mockResolvedValueOnce({
      success: true,
      message: 'History sync completed successfully',
      history: mockHistoryItems
    });

    const { container } = render(<HistorySync deviceId={deviceId} />);

    // Initial render should show empty state
    expect(screen.getByText('No history items found')).toBeInTheDocument();

    // Click sync button
    fireEvent.click(screen.getByText('Sync History'));

    // Wait for sync request
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'SYNC_HISTORY',
        deviceId
      });
    });

    // Wait for history items to be displayed
    await waitFor(() => {
      const titles = container.querySelectorAll('.history-title');
      const urls = container.querySelectorAll('.history-url');
      mockHistoryItems.forEach((item, index) => {
        expect(titles[index]).toHaveTextContent(item.title);
        expect(urls[index]).toHaveTextContent(item.url);
      });
    });

    // Check device info is displayed
    await waitFor(() => {
      const deviceNames = container.querySelectorAll('.device-name');
      const browserInfos = container.querySelectorAll('.device-browser');
      const osInfos = container.querySelectorAll('.device-os');

      expect(deviceNames).toHaveLength(mockHistoryItems.length);
      expect(browserInfos).toHaveLength(mockHistoryItems.length);
      expect(osInfos).toHaveLength(mockHistoryItems.length);
    });

    // Check success notification
    await waitFor(() => {
      expect(container.querySelector('.notification-success')).toHaveTextContent('History sync completed successfully');
    });
  });

  it('handles sync failure with network error', async () => {
    const networkError = new Error('Network error');
    mockSendMessage.mockRejectedValueOnce(networkError);
    
    const { container } = render(<HistorySync deviceId={deviceId} />);
    
    // Click sync button
    fireEvent.click(screen.getByText('Sync History'));

    // Wait for error notification and empty state
    await waitFor(() => {
      expect(container.querySelector('.notification-error')).toHaveTextContent('Failed to sync history: Network error');
      expect(screen.getByText('No history items found')).toBeInTheDocument();
    });
  });

  it('handles sync failure with server error response', async () => {
    mockSendMessage.mockResolvedValueOnce({
      success: false,
      message: 'Server error occurred'
    });
    
    const { container } = render(<HistorySync deviceId={deviceId} />);
    
    // Click sync button
    fireEvent.click(screen.getByText('Sync History'));

    // Wait for error notification and empty state
    await waitFor(() => {
      expect(container.querySelector('.notification-error')).toHaveTextContent('Failed to sync history: Server error occurred');
      expect(screen.getByText('No history items found')).toBeInTheDocument();
    });
  });

  it('shows loading state during sync', async () => {
    // eslint-disable-next-line no-unused-vars
    let resolveSync: (value: { success: boolean; message: string; history: typeof mockHistoryItems }) => void;
    const syncPromise = new Promise<{ success: boolean; message: string; history: typeof mockHistoryItems }>(resolve => {
      resolveSync = resolve;
    });

    mockSendMessage.mockImplementation(() => syncPromise);
    
    const { container } = render(<HistorySync deviceId={deviceId} />);
    const button = screen.getByText('Sync History');
    
    // Click sync button
    fireEvent.click(button);

    // Check loading state
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    // Resolve sync
    resolveSync!({
      success: true,
      message: 'Success',
      history: mockHistoryItems
    });

    // Check final state
    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Sync History')).toBeInTheDocument();
      const titles = container.querySelectorAll('.history-title');
      mockHistoryItems.forEach((item, index) => {
        expect(titles[index]).toHaveTextContent(item.title);
      });
    });
  });

  it('preserves history items between syncs', async () => {
    // First sync
    // eslint-disable-next-line no-unused-vars
    let resolveFirstSync: (value: { success: boolean; message: string; history: typeof mockHistoryItems }) => void;
    const firstSyncPromise = new Promise<{ success: boolean; message: string; history: typeof mockHistoryItems }>(resolve => {
      resolveFirstSync = resolve;
    });
    mockSendMessage.mockImplementationOnce(() => firstSyncPromise);

    const { container, rerender } = render(<HistorySync deviceId={deviceId} />);
    
    // Click sync button
    fireEvent.click(screen.getByText('Sync History'));

    // Resolve first sync
    resolveFirstSync!({
      success: true,
      message: 'Success',
      history: [mockHistoryItems[0]]
    });

    // Wait for first sync to complete
    await waitFor(() => {
      expect(container.querySelector('.history-title')).toHaveTextContent(mockHistoryItems[0].title);
    });

    // Second sync
    // eslint-disable-next-line no-unused-vars
    let resolveSecondSync: (value: { success: boolean; message: string; history: typeof mockHistoryItems }) => void;
    const secondSyncPromise = new Promise<{ success: boolean; message: string; history: typeof mockHistoryItems }>(resolve => {
      resolveSecondSync = resolve;
    });
    mockSendMessage.mockImplementationOnce(() => secondSyncPromise);

    // Click sync button again
    rerender(<HistorySync deviceId={deviceId} />);
    fireEvent.click(screen.getByText('Sync History'));

    // Resolve second sync
    resolveSecondSync!({
      success: true,
      message: 'Success',
      history: [mockHistoryItems[1], mockHistoryItems[2]]
    });

    // Wait for second sync to complete
    await waitFor(() => {
      const titles = container.querySelectorAll('.history-title');
      expect(titles[0]).toHaveTextContent(mockHistoryItems[1].title);
      expect(titles[1]).toHaveTextContent(mockHistoryItems[2].title);
    });
  });

  it('handles empty history response', async () => {
    // eslint-disable-next-line no-unused-vars
    let resolveSync: (value: { success: boolean; message: string; history: typeof mockHistoryItems }) => void;
    const syncPromise = new Promise<{ success: boolean; message: string; history: typeof mockHistoryItems }>(resolve => {
      resolveSync = resolve;
    });
    mockSendMessage.mockImplementationOnce(() => syncPromise);

    const { container } = render(<HistorySync deviceId={deviceId} />);
    
    // Initial state should show empty message
    expect(screen.getByText('No history items found')).toBeInTheDocument();
    
    // Click sync button
    fireEvent.click(screen.getByText('Sync History'));

    // Resolve sync with empty history
    resolveSync!({
      success: true,
      message: 'Success',
      history: []
    });

    // Should still show empty message and success notification
    await waitFor(() => {
      expect(screen.getByText('No history items found')).toBeInTheDocument();
      expect(container.querySelector('.notification-success')).toHaveTextContent('Success');
    });
  });
});