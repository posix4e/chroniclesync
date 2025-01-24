import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistorySync } from '../HistorySync';
import { DB } from '../../utils/db';
import * as deviceUtils from '../../utils/devices';

jest.mock('../../utils/devices', () => ({
  getDeviceName: jest.fn(),
  updateDeviceName: jest.fn(),
}));

const mockHistoryData = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Site',
    visitTime: Date.now() - 1000,
    deviceInfo: {
      id: 'device1',
      name: 'Device 1',
      browser: 'Chrome',
      os: 'Windows',
      lastSeen: Date.now()
    }
  },
  {
    id: '2',
    url: 'https://github.com',
    title: 'GitHub',
    visitTime: Date.now() - 2000,
    deviceInfo: {
      id: 'device2',
      name: 'Device 2',
      browser: 'Firefox',
      os: 'macOS',
      lastSeen: Date.now() - 100
    }
  }
];

const mockDevices = [
  {
    id: 'device1',
    name: 'Device 1',
    browser: 'Chrome',
    os: 'Windows',
    lastSeen: Date.now()
  },
  {
    id: 'device2',
    name: 'Device 2',
    browser: 'Firefox',
    os: 'macOS',
    lastSeen: Date.now() - 100
  }
];

const mockDB = {
  clientId: 'test-client',
  getData: jest.fn().mockResolvedValue({ history: mockHistoryData, devices: mockDevices }),
  setData: jest.fn().mockResolvedValue(undefined)
} as unknown as DB;

describe('HistorySync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (deviceUtils.getDeviceName as jest.Mock).mockResolvedValue('Test Device');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads and displays history items', async () => {
    render(<HistorySync db={mockDB} />);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    // Check device info is displayed
    expect(screen.getByText('Device 1')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
  });

  it('handles device name changes', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Device')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('Test Device');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Device Name');

    expect(deviceUtils.updateDeviceName).toHaveBeenCalledWith('New Device Name');
  });

  it('filters history by device', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    // Select Device 1 filter
    const filterSelect = screen.getByRole('combobox', { name: /filter/i });
    await userEvent.selectOptions(filterSelect, 'device1');

    // Should only show Example Site
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  });

  it('sorts history by date and device', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    // Default sort is by date (newest first)
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Example Site');
    expect(items[1]).toHaveTextContent('GitHub');

    // Sort by device
    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    await userEvent.selectOptions(sortSelect, 'device');

    // Should be sorted by device name
    const sortedItems = screen.getAllByRole('listitem');
    expect(sortedItems[0]).toHaveTextContent('Device 1');
    expect(sortedItems[1]).toHaveTextContent('Device 2');
  });

  it('shows active devices', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Active Devices')).toBeInTheDocument();
    });

    // Both devices should be listed
    expect(screen.getByText('Device 1')).toBeInTheDocument();
    expect(screen.getByText('Device 2')).toBeInTheDocument();

    // Device info should be shown
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Firefox')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('macOS')).toBeInTheDocument();
  });

  it('refreshes data periodically', async () => {
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(mockDB.getData).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have called getData again
    expect(mockDB.getData).toHaveBeenCalledTimes(2);
  });

  it('handles loading errors gracefully', async () => {
    mockDB.getData.mockRejectedValueOnce(new Error('Failed to load'));
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('handles empty history', async () => {
    mockDB.getData.mockResolvedValueOnce({ history: [], devices: [] });
    render(<HistorySync db={mockDB} />);

    await waitFor(() => {
      expect(screen.getByText('No history items yet')).toBeInTheDocument();
    });
  });
});