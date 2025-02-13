import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryView } from '../HistoryView';
import { getHistory } from '../../utils/api';

// Mock the api module
jest.mock('../../utils/api');
const mockGetHistory = getHistory as jest.MockedFunction<typeof getHistory>;

describe('HistoryView', () => {
  const mockHistoryData = {
    history: [
      {
        url: 'https://example.com',
        title: 'Example Site',
        visitTime: 1707864209000, // Fixed timestamp for consistent testing
        visitCount: 5,
        deviceId: 'device_123',
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        browserName: 'Chrome',
        browserVersion: '120.0.0.0',
        clientId: 'client_123'
      }
    ],
    pagination: {
      limit: 100,
      offset: 0,
      totalEntries: 1,
      totalPages: 1,
      currentPage: 1
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetHistory.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<HistoryView />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('displays history data correctly', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData);
    render(<HistoryView />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    // Check title
    expect(screen.getByText('Browsing History')).toBeInTheDocument();

    // Check history entry content
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('Visits: 5')).toBeInTheDocument();
    expect(screen.getByText('Chrome 120.0.0.0 on MacIntel')).toBeInTheDocument();
    expect(screen.getByText('Device: device_123')).toBeInTheDocument();

    // Check link
    const link = screen.getByRole('link', { name: 'Example Site' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows error state when API call fails', async () => {
    mockGetHistory.mockRejectedValue(new Error('API Error'));
    render(<HistoryView />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('displays URL when title is missing', async () => {
    const dataWithoutTitle = {
      history: [{
        ...mockHistoryData.history[0],
        title: ''
      }],
      pagination: mockHistoryData.pagination
    };
    mockGetHistory.mockResolvedValue(dataWithoutTitle);
    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
  });

  it('formats date correctly', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData);
    render(<HistoryView />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    // The exact format will depend on the user's locale, so we'll check for parts of the date
    const dateElement = screen.getByText(/2024|2025/); // Year
    expect(dateElement).toBeInTheDocument();
  });
});