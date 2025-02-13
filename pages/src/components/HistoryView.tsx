import React, { useEffect, useState } from 'react';
import { getHistory } from '../utils/api';

interface SystemInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

interface HistoryEntry extends SystemInfo {
  url: string;
  title: string;
  visitTime: number;
  visitCount: number;
}

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="history-view">
      <h2>Browsing History</h2>
      <div className="history-list">
        {history.map((entry, index) => {
          const date = new Date(entry.visitTime);
          return (
            <div key={index} className="history-item">
              <div className="history-item-time">
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </div>
              <div className="history-item-content">
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.title || entry.url}
                </a>
                <div className="history-item-details">
                  <span className="visit-count">Visits: {entry.visitCount}</span>
                  <span className="device-info">
                    {entry.browserName} {entry.browserVersion} on {entry.platform}
                  </span>
                  <span className="device-id">Device: {entry.deviceId}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};