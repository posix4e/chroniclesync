import React, { useEffect, useState } from 'react';
import { server } from '../../config';

interface HistoryEntry {
  url: string;
  title?: string;
  timestamp: number;
  deviceId: string;
  deviceInfo: {
    platform: string;
    browser: string;
    version: string;
  };
}

interface DeviceInfo {
  deviceId: string;
  lastSeen: number;
  platform: string;
  browser: string;
  version: string;
}

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${process.env.API_URL || server.apiUrl}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setHistory(data);

        // Extract unique devices
        const deviceMap = new Map<string, DeviceInfo>();
        data.forEach((entry: HistoryEntry) => {
          if (!deviceMap.has(entry.deviceId)) {
            deviceMap.set(entry.deviceId, {
              deviceId: entry.deviceId,
              lastSeen: entry.timestamp,
              ...entry.deviceInfo
            });
          } else {
            const device = deviceMap.get(entry.deviceId)!;
            if (entry.timestamp > device.lastSeen) {
              device.lastSeen = entry.timestamp;
            }
          }
        });
        setDevices(Array.from(deviceMap.values()));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = selectedDevice === 'all'
    ? history
    : history.filter(entry => entry.deviceId === selectedDevice);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="history-view">
      <h2>Browsing History</h2>
      
      <div className="device-selector">
        <label>
          Filter by Device:
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="all">All Devices</option>
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.platform} - {device.browser} {device.version}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="history-list">
        {filteredHistory.map((entry, index) => (
          <div key={index} className="history-item">
            <div className="history-title">
              <a href={entry.url} target="_blank" rel="noopener noreferrer">
                {entry.title || entry.url}
              </a>
            </div>
            <div className="history-meta">
              <span className="history-time">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <span className="history-device">
                {devices.find(d => d.deviceId === entry.deviceId)?.platform} - 
                {devices.find(d => d.deviceId === entry.deviceId)?.browser}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .history-view {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .device-selector {
          margin: 20px 0;
        }

        .device-selector select {
          margin-left: 10px;
          padding: 5px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .history-item {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .history-title {
          font-size: 16px;
          margin-bottom: 5px;
        }

        .history-title a {
          color: #0066cc;
          text-decoration: none;
        }

        .history-title a:hover {
          text-decoration: underline;
        }

        .history-meta {
          font-size: 12px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
};

export default HistoryView;