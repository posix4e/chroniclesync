import React, { useEffect, useState } from 'react';
import { DB } from '../utils/db';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceInfo: {
    name: string;
    browser: string;
    os: string;
  };
}

interface Props {
  db: DB;
}

export function HistorySync({ db }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const storedName = await chrome.storage.sync.get('deviceName');
        if (storedName.deviceName) {
          setDeviceName(storedName.deviceName);
        } else {
          const defaultName = `Device_${Math.random().toString(36).slice(2, 7)}`;
          await chrome.storage.sync.set({ deviceName: defaultName });
          setDeviceName(defaultName);
        }
      } catch {
        setError('Failed to load device info');
      }
    };

    loadDeviceInfo();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await db.getData();
        const storedHistory = data.history as HistoryItem[] || [];
        setHistory(storedHistory);
      } catch {
        setError('Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    if (db.clientId) {
      loadHistory();
    }
  }, [db]);

  const handleDeviceNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDeviceName(newName);
    try {
      await chrome.storage.sync.set({ deviceName: newName });
    } catch {
      setError('Failed to save device name');
    }
  };

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

      <h3>Browsing History</h3>
      {history.length === 0 ? (
        <p>No history items yet</p>
      ) : (
        <ul className="history-list">
          {history.map((item) => (
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