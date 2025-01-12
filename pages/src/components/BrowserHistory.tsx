import React, { useEffect, useState } from 'react';
import { DB } from '../utils/db';
import { HistoryEntry, HistoryState } from '../types';

interface Props {
  db: DB;
  onSync?: () => void;
}

export const BrowserHistory: React.FC<Props> = ({ db, onSync }) => {
  const [state, setState] = useState<HistoryState>({
    entries: [],
    lastSync: 0,
    syncing: false
  });

  const loadHistory = async () => {
    try {
      const entries = await db.getHistory();
      setState(prev => ({ ...prev, entries }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  const syncHistory = async () => {
    if (!db.clientId) return;
    
    setState(prev => ({ ...prev, syncing: true, error: undefined }));
    try {
      // Get current browser history using the History API
      const currentHistory = await db.getHistory();
      
      // Add new entries to IndexedDB
      const promises = currentHistory.map(entry => db.addHistoryEntry(entry));
      await Promise.all(promises);
      
      // Update state
      await loadHistory();
      setState(prev => ({
        ...prev,
        lastSync: Date.now(),
        syncing: false
      }));
      
      if (onSync) onSync();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        syncing: false
      }));
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="browser-history">
      <h2>Browser History</h2>
      <div className="controls">
        <button
          onClick={syncHistory}
          disabled={state.syncing}
        >
          {state.syncing ? 'Syncing...' : 'Sync History'}
        </button>
        {state.lastSync > 0 && (
          <span className="last-sync">
            Last synced: {new Date(state.lastSync).toLocaleString()}
          </span>
        )}
      </div>
      
      {state.error && (
        <div className="error">Error: {state.error}</div>
      )}

      <div className="history-list">
        {state.entries.map((entry: HistoryEntry) => (
          <div key={entry.timestamp} className="history-item">
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              {entry.title || entry.url}
            </a>
            <span className="timestamp">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};