import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DB } from '../utils/db';
import { HistoryManager } from '../utils/history';

interface HistorySectionProps {
  db: DB;
}

interface HistoryEntry {
  timestamp: number;
  action: string;
  data: unknown;
  clientId: string;
}

interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime?: number;
  pendingChanges: number;
}

export function HistorySection({ db }: HistorySectionProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyManager, setHistoryManager] = useState<HistoryManager | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'synced',
    pendingChanges: 0
  });
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (db.clientId && !historyManager) {
      const manager = new HistoryManager(db);
      manager.init().then(() => {
        setHistoryManager(manager);
        // Connect to background script
        chrome.runtime.sendMessage({ type: 'CONNECT_CLIENT' });
        setSyncStatus(prev => ({ ...prev, status: 'synced' }));
      }).catch(() => {
        setSyncStatus(prev => ({ ...prev, status: 'error' }));
      });

      // Update sync status based on online/offline state
      const handleOnline = () => {
        setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
        manager.syncPendingChanges().then(() => {
          setSyncStatus(prev => ({ 
            ...prev, 
            status: 'synced',
            lastSyncTime: Date.now(),
            pendingChanges: 0
          }));
        });
      };

      const handleOffline = () => {
        setSyncStatus(prev => ({ ...prev, status: 'offline' }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        // Disconnect from background script
        chrome.runtime.sendMessage({ type: 'DISCONNECT_CLIENT' });
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [db.clientId]);

  // Filter history based on search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    
    const query = searchQuery.toLowerCase();
    return history.filter(entry => {
      const url = entry.data && typeof entry.data === 'object' && 'url' in entry.data
        ? (entry.data as { url: string }).url.toLowerCase()
        : '';
      const action = entry.action.toLowerCase();
      return url.includes(query) || action.includes(query);
    });
  }, [history, searchQuery]);

  // Handle navigation to history entry
  const handleNavigate = useCallback((entry: HistoryEntry) => {
    setSelectedEntry(entry);
    if (entry.data && typeof entry.data === 'object' && 'url' in entry.data) {
      const url = (entry.data as { url: string }).url;
      window.location.href = url;
    }
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (db.clientId) {
        const entries = await db.getHistory();
        setHistory(entries);

        // Update sync status
        setSyncStatus(prev => ({
          ...prev,
          pendingChanges: entries.filter(e => !e.synced).length
        }));

        // Sync history with other clients
        if (entries.length > 0) {
          setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
          try {
            await chrome.runtime.sendMessage({
              type: 'SYNC_HISTORY',
              entries
            });
            setSyncStatus(prev => ({
              ...prev,
              status: 'synced',
              lastSyncTime: Date.now()
            }));
          } catch {
            setSyncStatus(prev => ({ ...prev, status: 'error' }));
          }
        }
      }
    };

    loadHistory();
    
    // Set up interval to refresh history
    const interval = setInterval(loadHistory, 1000);
    return () => clearInterval(interval);
  }, [db.clientId]);

  // Listen for history updates from background script
  useEffect(() => {
    const handleMessage = async (
      message: { type: string; action?: string; data?: unknown; entries?: HistoryEntry[] }
    ) => {
      if (message.type === 'HISTORY_UPDATED' && message.action && message.data) {
        await db.addHistoryEntry(message.action, message.data);
        const entries = await db.getHistory();
        setHistory(entries);
      } else if (message.type === 'HISTORY_SYNC' && message.entries) {
        // Merge received entries with local history
        for (const entry of message.entries) {
          await db.addHistoryEntry(entry.action, entry.data);
        }
        const entries = await db.getHistory();
        setHistory(entries);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [db]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatData = (data: unknown) => {
    if (typeof data === 'object' && data !== null && 'url' in data) {
      return (data as { url: string }).url;
    }
    return JSON.stringify(data, null, 2);
  };

  const getEntryClass = (action: string) => {
    switch (action) {
    case 'navigation':
      return 'history-entry-navigation';
    case 'pushState':
      return 'history-entry-push';
    case 'replaceState':
      return 'history-entry-replace';
    case 'popstate':
      return 'history-entry-pop';
    default:
      return '';
    }
  };

  return (
    <div id="historySection">
      <div className="history-header" style={{ marginBottom: '16px' }}>
        <h3>History</h3>
        <div className="sync-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <div 
            className={`sync-indicator ${syncStatus.status}`}
            style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%',
              backgroundColor: 
                syncStatus.status === 'synced' ? '#4CAF50' :
                  syncStatus.status === 'syncing' ? '#2196F3' :
                    syncStatus.status === 'offline' ? '#FF9800' : '#f44336'
            }}
          />
          <span style={{ fontSize: '0.9em', color: '#666' }}>
            {syncStatus.status === 'synced' && 'Synced'}
            {syncStatus.status === 'syncing' && 'Syncing...'}
            {syncStatus.status === 'offline' && 'Offline'}
            {syncStatus.status === 'error' && 'Sync Error'}
            {syncStatus.lastSyncTime && ` (Last: ${formatTimestamp(syncStatus.lastSyncTime)})`}
          </span>
          {syncStatus.pendingChanges > 0 && (
            <span style={{ fontSize: '0.8em', color: '#FF9800' }}>
              {syncStatus.pendingChanges} pending changes
            </span>
          )}
        </div>
        <div className="search-bar" style={{ marginTop: '12px' }}>
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>
      <div 
        data-testid="history-container" 
        className="history-container" 
        style={{ maxHeight: '300px', overflowY: 'auto', display: 'block' }}
      >
        {filteredHistory.map((entry, index) => (
          <div 
            key={index} 
            data-testid="history-entry" 
            className={`history-entry ${getEntryClass(entry.action)} ${selectedEntry === entry ? 'selected' : ''}`}
            onClick={() => handleNavigate(entry)}
            style={{ 
              padding: '8px',
              margin: '4px 0',
              borderLeft: '4px solid',
              borderLeftColor: entry.action === 'navigation' ? '#4CAF50' : 
                entry.action === 'pushState' ? '#2196F3' :
                  entry.action === 'replaceState' ? '#FF9800' : '#9C27B0',
              cursor: 'pointer',
              backgroundColor: selectedEntry === entry ? '#f5f5f5' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div className="entry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div data-testid="history-timestamp" className="history-timestamp" style={{ fontSize: '0.8em', color: '#666' }}>
                {formatTimestamp(entry.timestamp)}
              </div>
              <div data-testid="history-action" className="history-action" style={{ 
                fontSize: '0.8em',
                padding: '2px 6px',
                borderRadius: '12px',
                backgroundColor: entry.action === 'navigation' ? '#E8F5E9' :
                  entry.action === 'pushState' ? '#E3F2FD' :
                    entry.action === 'replaceState' ? '#FFF3E0' : '#F3E5F5',
                color: entry.action === 'navigation' ? '#2E7D32' :
                  entry.action === 'pushState' ? '#1565C0' :
                    entry.action === 'replaceState' ? '#EF6C00' : '#6A1B9A'
              }}>
                {entry.action}
              </div>
            </div>
            <div data-testid="history-data" className="history-data" style={{ 
              marginTop: '4px', 
              wordBreak: 'break-all',
              fontSize: '0.9em',
              color: '#333'
            }}>
              {formatData(entry.data)}
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {searchQuery ? 'No matching history entries found' : 'No history entries yet'}
          </div>
        )}
      </div>
    </div>
  );
}