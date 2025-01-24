import React, { useState, useEffect } from 'react';
import './HistorySync.css';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
}

interface HistorySyncProps {
  deviceId: string;
}

export function HistorySync({ deviceId }: HistorySyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const loadHistory = async () => {
    if (chrome?.history) {
      const items = await chrome.history.search({
        text: '',
        maxResults: 10,
        startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
      });
      
      setHistoryItems(items.map(item => ({
        id: item.id || Math.random().toString(36).substring(2),
        url: item.url || '',
        title: item.title || 'Untitled',
        visitTime: item.lastVisitTime || Date.now(),
        deviceId
      })));
    }
  };

  useEffect(() => {
    loadHistory();
  }, [deviceId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_HISTORY',
        deviceId
      });
      
      if (response.success) {
        alert(response.message);
        await loadHistory(); // Reload history after sync
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      alert('Failed to sync history: ' + (error as Error).message);
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}