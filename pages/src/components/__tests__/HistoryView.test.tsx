import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryView from '../HistoryView';

// Mock fetch
global.fetch = jest.fn();

describe('HistoryView', () => {
  const mockHistory = [
    {
      url: 'https://example.com',
      title: 'Example Site',
      timestamp: Date.now(),
      deviceId: 'device1',
      deviceInfo: {
        platform: 'Windows',
        browser: 'Chrome',
        version: '120.0.0'
      }
    },
    {
      url: 'https://test.com',
      title: 'Test Site',
      timestamp: Date.now() - 1000,
      deviceId: 'device2',
      deviceInfo: {
        platform: 'MacOS',
        browser: 'Chrome',
        version: '120.0.0'
      }
    }
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders history entries and allows filtering by device', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory
    });

    render(<HistoryView />);

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    // Check if both entries are visible
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();

    // Check device filter options
    const deviceSelect = screen.getByLabelText(/Filter by Device/i);
    expect(deviceSelect).toBeInTheDocument();

    // Filter by first device
    await userEvent.selectOptions(deviceSelect, 'device1');
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.queryByText('Test Site')).not.toBeInTheDocument();

    // Filter by second device
    await userEvent.selectOptions(deviceSelect, 'device2');
    expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<HistoryView />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});