import React, { useEffect, useState, useMemo } from 'react';
import { DB } from '../utils/db';
import { DeviceInfo, getDeviceName, updateDeviceName } from '../utils/devices';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceInfo: DeviceInfo;
}

interface Props {
  db: DB;
}

type SortBy = 'date' | 'device';
type FilterBy = 'all' | string; // 'all' or device ID

export function HistorySync({ db }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');

  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const name = await getDeviceName();
        setDeviceName(name);
      } catch {
        setError('Failed to load device info');
      }
    };

    loadDeviceInfo();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await db.getData();
        setHistory(data.history || []);
        setDevices(data.devices || []);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (db.clientId) {
      loadData();
      // Refresh data periodically
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [db]);

  const handleDeviceNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDeviceName(newName);
    try {
      await updateDeviceName(newName);
    } catch {
      setError('Failed to save device name');
    }
  };

  const sortedAndFilteredHistory = useMemo(() => {
    let items = [...history];

    // Apply device filter
    if (filterBy !== 'all') {
      items = items.filter(item => item.deviceInfo.id === filterBy);
    }

    // Apply sorting
    if (sortBy === 'date') {
      items.sort((a, b) => b.visitTime - a.visitTime);
    } else {
      items.sort((a, b) => a.deviceInfo.name.localeCompare(b.deviceInfo.name));
    }

    return items;
  }, [history, sortBy, filterBy]);

  const activeDevices = useMemo(() => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    return devices.filter(d => d.lastSeen > oneHourAgo);
  }, [devices]);

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="history-sync">
      <div className="device-info">
        <label>
          Device Name:
          <input
            type="text"
            value={deviceName}
            onChange={handleDeviceNameChange}
            placeholder="Enter device name"
          />
        </label>
      </div>

      <div className="active-devices">
        <h3>Active Devices</h3>
        <div className="device-list">
          {activeDevices.map(device => (
            <div key={device.id} className="device-item">
              <span className="device-name">{device.name}</span>
              <span className="device-browser">{device.browser}</span>
              <span className="device-os">{device.os}</span>
              <span className="last-seen">
                Last seen: {new Date(device.lastSeen).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="history-controls">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
          <option value="date">Sort by Date</option>
          <option value="device">Sort by Device</option>
        </select>

        <select value={filterBy} onChange={e => setFilterBy(e.target.value)}>
          <option value="all">All Devices</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <h3>Browsing History</h3>
      {sortedAndFilteredHistory.length === 0 ? (
        <p>No history items yet</p>
      ) : (
        <ul className="history-list">
          {sortedAndFilteredHistory.map((item) => (
            <li key={item.id} className="history-item">
              <div className="history-title">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title || item.url}
                </a>
              </div>
              <div className="history-meta">
                <span className="device-name">{item.deviceInfo.name}</span>
                <span className="device-browser">{item.deviceInfo.browser}</span>
                <span className="device-os">{item.deviceInfo.os}</span>
                <span className="visit-time">
                  {new Date(item.visitTime).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}