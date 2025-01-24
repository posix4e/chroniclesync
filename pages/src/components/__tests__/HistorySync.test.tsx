import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistorySync } from '../HistorySync';
import { DB } from '../../utils/db';

const mockHistoryData = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Site',
    visitTime: Date.now(),
    deviceInfo: {
      name: 'Test Device',
      browser: 'Chrome',
      os: 'Windows'
    }
  }
];

const mockDB = {
  clientId: 'test-client',
  getData: jest.fn().mockResolvedValue({ history: mockHistoryData }),
  setData: jest.fn().mockResolvedValue(undefined)
} as unknown as DB & {
  getData: jest.Mock;
  setData: jest.Mock;
};

const mockStorage = {
  sync: {
    get: jest.fn().mockResolvedValue({ deviceName: 'Test Device' }),
    set: jest.fn().mockResolvedValue(undefined)
  }
};

beforeAll(() => {
  global.chrome = {
    storage: mockStorage
  } as unknown as typeof chrome;
});

describe('HistorySync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays history items', async () => {
    render(<HistorySync db={mockDB} />);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Device')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
  });

  it('handles empty history', async () => {
    mockDB.getData.mockResolvedValueOnce({ history: [] });
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('No history items yet')).toBeInTheDocument();
    });
  });

  it('allows changing device name', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Device')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('Test Device');
    fireEvent.change(input, { target: { value: 'New Device Name' } });

    expect(mockStorage.sync.set).toHaveBeenCalledWith({
      deviceName: 'New Device Name'
    });
  });

  it('handles loading error', async () => {
    mockDB.getData.mockRejectedValueOnce(new Error('Failed to load'));
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('handles device info loading error', async () => {
    mockStorage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load device info')).toBeInTheDocument();
    });
  });
});