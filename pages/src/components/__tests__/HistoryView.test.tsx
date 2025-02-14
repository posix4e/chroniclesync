import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryView } from '../HistoryView';
import { fetchHistory } from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');
const mockFetchHistory = fetchHistory as jest.MockedFunction<typeof fetchHistory>;

const mockHistoryData = {
  history: [
    {
      url: 'https://example.com',
      title: 'Example Website',
      visitTime: 1644825600000,
      visitCount: 1,
      deviceId: 'test-device',
      platform: 'Win32',
      userAgent: 'Chrome',
      browserName: 'Chrome',
      browserVersion: '100.0.0'
    }
  ],
  deviceInfo: {
    deviceId: 'test-device',
    platform: 'Win32',
    userAgent: 'Chrome',
    browserName: 'Chrome',
    browserVersion: '100.0.0'
  }
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
    mockFetchHistory.mockResolvedValue(mockHistoryData);
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
    mockFetchHistory.mockResolvedValue({ history: [], deviceInfo: mockHistoryData.deviceInfo });
    render(<HistoryView clientId="test-client" />);

    await waitFor(() => {
      expect(screen.getByText('No history found')).toBeInTheDocument();
    });
  });
});