import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistorySync } from '../HistorySync';

// Mock chrome.runtime.sendMessage
const mockSendMessage = jest.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage
  }
} as any;

describe('HistorySync', () => {
  const deviceId = 'test-device-123';

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  it('renders with device ID', () => {
    render(<HistorySync deviceId={deviceId} />);
    expect(screen.getByText(`Device ID: ${deviceId}`)).toBeInTheDocument();
    expect(screen.getByText('Sync History')).toBeInTheDocument();
  });

  it('handles successful sync', async () => {
    const successMessage = 'History sync completed successfully';
    mockSendMessage.mockResolvedValueOnce({ success: true, message: successMessage });
    
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();
    
    render(<HistorySync deviceId={deviceId} />);
    
    fireEvent.click(screen.getByText('Sync History'));
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'SYNC_HISTORY',
        deviceId
      });
      expect(alertMock).toHaveBeenCalledWith(successMessage);
    });
    
    alertMock.mockRestore();
  });

  it('handles sync failure', async () => {
    const errorMessage = 'Sync failed';
    mockSendMessage.mockRejectedValueOnce(new Error(errorMessage));
    
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();
    
    render(<HistorySync deviceId={deviceId} />);
    
    fireEvent.click(screen.getByText('Sync History'));
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'SYNC_HISTORY',
        deviceId
      });
      expect(alertMock).toHaveBeenCalledWith('Failed to sync history: ' + errorMessage);
    });
    
    alertMock.mockRestore();
  });

  it('disables button during sync', async () => {
    mockSendMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<HistorySync deviceId={deviceId} />);
    
    const button = screen.getByText('Sync History');
    fireEvent.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Sync History')).toBeInTheDocument();
    });
  });
});