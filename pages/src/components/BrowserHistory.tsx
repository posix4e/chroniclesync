import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
  os: string;
}

interface BrowserHistoryProps {
  clientId: string;
}

export const BrowserHistory: React.FC<BrowserHistoryProps> = ({ clientId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/history/${clientId}`);
        setHistory(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch browser history');
        setLoading(false);
      }
    };

    fetchHistory();
  }, [clientId]);

  if (loading) return <div>Loading history...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browser-history">
      <h2>Browser History for Client {clientId}</h2>
      <div className="history-list">
        {history.map((item, index) => (
          <div key={index} className="history-item">
            <div className="history-title">{item.title}</div>
            <div className="history-url">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.url}
              </a>
            </div>
            <div className="history-meta">
              <span>Device: {item.deviceId}</span>
              <span>OS: {item.os}</span>
              <span>Visited: {new Date(item.visitTime).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};