import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';

interface SyncState {
  lastSync: string;
  totalEntries: number;
  syncStatus: string;
}

const DevTools: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: 'Never',
    totalEntries: 0,
    syncStatus: 'Unknown'
  });

  useEffect(() => {
    const updateState = async () => {
      const store = new HistoryStore();
      await store.init();
      const entries = await store.getEntries();
      const unsyncedEntries = await store.getUnsyncedEntries();

      setSyncState({
        lastSync: entries.length > 0 
          ? new Date(Math.max(...entries.map(e => e.lastModified))).toLocaleString() 
          : 'Never',
        totalEntries: entries.length,
        syncStatus: unsyncedEntries.length > 0 ? 'Syncing' : 'Synced'
      });
    };

    updateState();
    const interval = setInterval(updateState, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="devtools-container">
      <div className="section">
        <h2>Sync Status</h2>
        <div className="info-row">
          <span className="info-label">Last Sync:</span>
          <span className="info-value">{syncState.lastSync}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Total Entries:</span>
          <span className="info-value">{syncState.totalEntries}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Status:</span>
          <span className="info-value">{syncState.syncStatus}</span>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<DevTools />);