import React, { useEffect, useState } from 'react';
import { getHistory } from '../utils/api';

interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
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
          const date = new Date(entry.timestamp);
          return (
            <div key={index} className="history-item">
              <div className="history-item-time">
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </div>
              <div className="history-item-content">
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.title || entry.url}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};