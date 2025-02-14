import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { getClientIdFromExtension } from './utils/extension-messaging';

// Mock the extension messaging module
jest.mock('./utils/extension-messaging');

describe('App', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  it('loads client ID from extension on mount', async () => {
    const mockClientId = 'test-client-123';
    (getClientIdFromExtension as jest.Mock).mockResolvedValue(mockClientId);

    render(<App />);

    // Wait for the client ID to be loaded
    await waitFor(() => {
      expect(getClientIdFromExtension).toHaveBeenCalled();
    });
  });

  it('shows history view when client ID is available', async () => {
    const mockClientId = 'test-client-123';
    (getClientIdFromExtension as jest.Mock).mockResolvedValue(mockClientId);

    render(<App />);

    // Navigate to history page
    const historyLink = screen.getByText(/History/i);
    historyLink.click();

    // History view should be shown instead of the "set client ID" message
    await waitFor(() => {
      expect(screen.queryByText(/Please set your client ID/i)).not.toBeInTheDocument();
    });
  });

  it('shows "set client ID" message when no client ID is available', async () => {
    (getClientIdFromExtension as jest.Mock).mockResolvedValue(null);

    render(<App />);

    // Navigate to history page
    const historyLink = screen.getByText(/History/i);
    historyLink.click();

    // Should show the "set client ID" message
    await waitFor(() => {
      expect(screen.getByText(/Please set your client ID/i)).toBeInTheDocument();
    });
  });
});