import React, { useEffect, useState } from 'react';
import { HistoryEntry, DeviceInfo } from '../types';

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('all'); // all, day, week, month

  useEffect(() => {
    // Load devices first
    chrome.runtime.sendMessage({ type: 'getDevices' }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        setDevices(response);
      }
    });

    loadHistory();
  }, []);

  const loadHistory = (deviceId?: string, since?: number) => {
    setLoading(true);
    chrome.runtime.sendMessage({
      type: 'getHistory',
      deviceId,
      since
    }, (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
      } else {
        setHistory(response);
      }
    });
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    setSelectedDevice(deviceId);
    loadHistory(deviceId, getTimeFilterValue());
  };

  const handleTimeFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filter = event.target.value;
    setTimeFilter(filter);
    loadHistory(selectedDevice, getTimeFilterValue());
  };

  const getTimeFilterValue = (): number | undefined => {
    const now = Date.now();
    switch (timeFilter) {
    case 'day':
      return now - 24 * 60 * 60 * 1000;
    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return undefined;
    }
  };

  const handleDelete = (visitId: string) => {
    chrome.runtime.sendMessage({
      type: 'deleteHistory',
      visitId
    }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        // Reload history after deletion
        loadHistory(selectedDevice, getTimeFilterValue());
      }
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) return deviceId;
    return `${device.browserName} on ${device.platform}`;
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="history-view">
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="device-filter">Device:</label>
          <select
            id="device-filter"
            value={selectedDevice}
            onChange={handleDeviceChange}
          >
            <option value="">All Devices</option>
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.browserName} on {device.platform}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="time-filter">Time:</label>
          <select
            id="time-filter"
            value={timeFilter}
            onChange={handleTimeFilterChange}
          >
            <option value="all">All Time</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">No history entries found</div>
          ) : (
            history.map(entry => (
              <div key={entry.visitId} className="history-item">
                <div className="history-item-header">
                  <div className="url-display">{new URL(entry.url).hostname}</div>
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    {entry.title || entry.url}
                  </a>
                  <button
                    onClick={() => handleDelete(entry.visitId)}
                    className="delete-button"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                {entry.summary && entry.summary.status === 'completed' && (
                  <div className="history-item-summary">
                    {entry.summary.content}
                  </div>
                )}
                {entry.summaryStatus === 'error' && (
                  <div className="history-item-summary error">
                    Failed to generate summary: {entry.summaryError}
                  </div>
                )}
                <div className="history-item-meta">
                  <span className="device-info" title={`${entry.browserName} ${entry.browserVersion}`}>
                    {getDeviceName(entry.deviceId)}
                  </span>
                  <span className="visit-time">
                    {formatDate(entry.visitTime)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default History;