import React, { useState, useEffect } from 'react';
import { Notification } from './Notification';
import './HistorySync.css';

interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastSync: number;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
  deviceInfo?: DeviceInfo;
}

interface HistorySyncProps {
  deviceId: string;
}

export function HistorySync({ deviceId }: HistorySyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadHistory = async () => {
    if (!chrome?.history) return;

    const items = await chrome.history.search({
      text: '',
      maxResults: 10,
      startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    });
    
    const mappedItems = items.map(item => ({
      id: item.id || Math.random().toString(36).substring(2),
      url: item.url || '',
      title: item.title || 'Untitled',
      visitTime: item.lastVisitTime || Date.now(),
      deviceId
    }));

    setHistoryItems(mappedItems);
  };

  useEffect(() => {
    loadHistory();
  }, [deviceId]);

  const handleSync = async () => {
    setSyncing(true);
    setNotification(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_HISTORY',
        deviceId
      });
      
      if (response.success) {
        if (response.history) {
          setHistoryItems(response.history);
        } else {
          await loadHistory(); // Fallback to loading local history
        }
        setNotification({ message: response.message, type: 'success' });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({ message: 'Failed to sync history: ' + (error as Error).message, type: 'error' });
      setHistoryItems([]); // Clear history on error
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="history-sync">
      <h2>Browser History Sync</h2>
      <p>Device ID: {deviceId}</p>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="sync-button"
      >
        {syncing ? 'Syncing...' : 'Sync History'}
      </button>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="history-list">
        <h3>Recent History</h3>
        {historyItems.length === 0 ? (
          <p>No history items found</p>
        ) : (
          <ul>
            {historyItems.map(item => (
              <li key={item.id} className="history-item">
                <div className="history-title">{item.title}</div>
                <div className="history-url">{item.url}</div>
                <div className="history-time">
                  {new Date(item.visitTime).toLocaleString()}
                </div>
                {item.deviceInfo && (
                  <div className="device-info">
                    <span className="device-name">{item.deviceInfo.name}</span>
                    <span className="device-browser">{item.deviceInfo.browser}</span>
                    <span className="device-os">OS: {item.deviceInfo.os}</span>
                    <span className="device-sync">Last Sync: {new Date(item.deviceInfo.lastSync).toLocaleString()}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}