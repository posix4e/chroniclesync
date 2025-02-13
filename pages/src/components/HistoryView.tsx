import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';

interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  visitCount: number;
  deviceId: string;
  platform: string;
  browserName: string;
  browserVersion: string;
}

interface HistoryViewProps {
  clientId: string;
}

export function HistoryView({ clientId }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'visitTime' | 'visitCount'>('visitTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}?clientId=${encodeURIComponent(clientId)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.history) {
          setHistory(data.history);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchHistory();
    }
  }, [clientId]);

  const sortedHistory = [...history].sort((a, b) => {
    const compareValue = sortOrder === 'asc' ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * compareValue;
  });

  const toggleSort = (field: 'visitTime' | 'visitCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="history-view">
      <h3>Browsing History</h3>
      <div className="sort-controls">
        <button onClick={() => toggleSort('visitTime')}>
          Sort by Time {sortBy === 'visitTime' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => toggleSort('visitCount')}>
          Sort by Visits {sortBy === 'visitCount' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
      <div className="history-list">
        {sortedHistory.map((item, index) => (
          <div key={index} className="history-item">
            <div className="history-title">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title || item.url}
              </a>
            </div>
            <div className="history-meta">
              <span>Visited: {new Date(item.visitTime).toLocaleString()}</span>
              <span>Visit count: {item.visitCount}</span>
              <span>Device: {item.deviceId}</span>
              <span>Browser: {item.browserName} {item.browserVersion}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}