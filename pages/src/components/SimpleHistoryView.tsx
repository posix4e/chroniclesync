import React, { useEffect, useState } from 'react';
import { DB } from '../utils/db';
import { SimpleHistoryManager, HistoryEntry } from '../utils/simple-history';

interface SimpleHistoryViewProps {
  db: DB;
}

export function SimpleHistoryView({ db }: SimpleHistoryViewProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [manager, setManager] = useState<SimpleHistoryManager | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (db.clientId && !manager) {
      const historyManager = new SimpleHistoryManager(db);
      setManager(historyManager);

      // Update online status
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [db.clientId]);

  useEffect(() => {
    const loadEntries = async () => {
      if (manager) {
        const historyEntries = await manager.getEntries();
        setEntries(historyEntries.sort((a, b) => b.timestamp - a.timestamp));
      }
    };

    loadEntries();
    const interval = setInterval(loadEntries, 1000);
    return () => clearInterval(interval);
  }, [manager]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div data-testid="history-container" className="history-container">
      <div className="history-header">
        <h3>Browsing History</h3>
        <div className="sync-status">
          Status: {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
      <div className="history-list">
        {entries.map(entry => (
          <div
            key={entry.timestamp}
            data-testid="history-entry"
            className={`history-entry ${entry.synced ? 'synced' : 'pending'}`}
            style={{
              padding: '8px',
              margin: '4px 0',
              borderLeft: '4px solid',
              borderLeftColor: entry.synced ? '#4CAF50' : '#FFA000'
            }}
          >
            <div className="entry-time" data-testid="history-timestamp">
              {formatTime(entry.timestamp)}
            </div>
            <div className="entry-title" data-testid="history-title">
              {entry.title}
            </div>
            <div className="entry-url" data-testid="history-url">
              {entry.url}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="no-history">
            No history entries yet
          </div>
        )}
      </div>
    </div>
  );
}