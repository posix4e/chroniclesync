import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HistoryView } from '../HistoryView';
import { fetchHistory } from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');
const mockFetchHistory = fetchHistory as jest.MockedFunction<typeof fetchHistory>;

const mockHistoryData = {
  history: [
    {
      visitId: 'test-visit',
      url: 'https://example.com',
      title: 'Example Website',
      visitTime: 1644825600000,
      visitCount: 1,
      platform: 'Win32',
      browserName: 'Chrome',
      browserVersion: '100.0.0'
    }
  ]
};

describe('HistoryView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    mockFetchHistory.mockImplementation(() => new Promise(() => {}));
    render(<HistoryView clientId="test-client" />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('displays history items when loaded successfully', async () => {
    mockFetchHistory.mockResolvedValue({
      ...mockHistoryData,
      pagination: {
        totalItems: mockHistoryData.history.length,
        currentPage: 1,
        totalPages: Math.ceil(mockHistoryData.history.length / 10)
      }
    });
    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument();
    });

    expect(screen.getByText(/https:\/\/example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Chrome 100.0.0/)).toBeInTheDocument();
  });

  it('displays error message when loading fails', async () => {
    mockFetchHistory.mockRejectedValue(new Error('Failed to fetch'));
    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('displays no history message when history is empty', async () => {
    mockFetchHistory.mockResolvedValue({
      history: [],
      pagination: {
        totalItems: 0,
        currentPage: 1,
        totalPages: 0
      }
    });
    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('No history found')).toBeInTheDocument();
    });
  });

  it('allows changing page size', async () => {
    mockFetchHistory.mockResolvedValue({
      ...mockHistoryData,
      pagination: {
        totalItems: mockHistoryData.history.length,
        currentPage: 1,
        totalPages: Math.ceil(mockHistoryData.history.length / 10)
      }
    });
    render(<HistoryView clientId="test-client" />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
    });

    // Change page size to 25
    const pageSizeSelect = screen.getByTestId('page-size-select');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    // Verify that fetchHistory was called with the new page size
    await waitFor(() => {
      expect(mockFetchHistory).toHaveBeenCalledWith('test-client', expect.objectContaining({
        pageSize: 25,
        page: 1 // Page should reset to 1 when changing page size
      }));
    });
  });

  it('resets to page 1 when changing page size', async () => {
    mockFetchHistory.mockResolvedValue({
      ...mockHistoryData,
      pagination: {
        totalItems: 100,
        currentPage: 5,
        totalPages: 10
      }
    });
    render(<HistoryView clientId="test-client" />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
    });

    // Change page size to 25
    const pageSizeSelect = screen.getByTestId('page-size-select');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    // Verify that the page was reset to 1
    await waitFor(() => {
      expect(mockFetchHistory).toHaveBeenCalledWith('test-client', expect.objectContaining({
        pageSize: 25,
        page: 1
      }));
    });
  });
});