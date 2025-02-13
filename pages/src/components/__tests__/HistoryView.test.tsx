import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryView } from '../HistoryView';
import { API_URL } from '../../utils/api';

// Mock fetch
global.fetch = jest.fn();

describe('HistoryView', () => {
  const mockHistoryData = {
    history: [
      {
        url: 'https://example.com',
        title: 'Example Website',
        visitTime: Date.now() - 1000 * 60 * 5,
        visitCount: 3,
        deviceId: 'test-device-1',
        platform: 'MacIntel',
        browserName: 'Chrome',
        browserVersion: '120.0.0'
      },
      {
        url: 'https://github.com',
        title: 'GitHub',
        visitTime: Date.now() - 1000 * 60 * 10,
        visitCount: 5,
        deviceId: 'test-device-1',
        platform: 'MacIntel',
        browserName: 'Chrome',
        browserVersion: '120.0.0'
      }
    ]
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('fetches and displays history data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistoryData
    });

    render(<HistoryView clientId="test-client" />);

    // Check loading state
    expect(screen.getByText('Loading history...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument();
    });

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}?clientId=test-client`,
      expect.any(Object)
    );

    // Verify history items are displayed
    expect(screen.getByText('Example Website')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();

    // Verify metadata is displayed
    expect(screen.getByText(/Visit count: 3/)).toBeInTheDocument();
    expect(screen.getAllByText(/Chrome/).length).toBeGreaterThan(0);
  });

  it('handles sorting by visit count', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistoryData
    });

    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument();
    });

    // Click sort by visits button
    fireEvent.click(screen.getByText(/Sort by Visits/));

    // GitHub should be first (5 visits)
    const historyItems = screen.getAllByRole('link');
    expect(historyItems[0]).toHaveTextContent('GitHub');
  });

  it('handles sorting by time', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistoryData
    });

    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument();
    });

    // Click sort by time button twice to get descending order
    fireEvent.click(screen.getByText(/Sort by Time/));
    fireEvent.click(screen.getByText(/Sort by Time/));

    // Example Website should be first (more recent)
    const historyItems = screen.getAllByRole('link');
    expect(historyItems[0]).toHaveTextContent('Example Website');
  });

  it('handles empty history data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: [] })
    });

    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });
});