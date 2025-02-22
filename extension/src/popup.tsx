import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
  lastVisitTime: number;
  syncStatus: 'pending' | 'synced' | 'error';
}

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load saved state and history when component mounts
  useEffect(() => {
    chrome.storage.sync.get(['clientId', 'initialized', 'lastSync'], (result) => {
      if (result.clientId) {
        setClientId(result.clientId);
      }
      if (result.initialized) {
        setInitialized(result.initialized);
      }
      if (result.lastSync) {
        const lastSyncDate = new Date(result.lastSync);
        setLastSync(lastSyncDate.toLocaleString());
      }
    });

    // Load history entries
    chrome.runtime.sendMessage({ type: 'getHistory', limit: 50 }, (response) => {
      if (response) {
        setHistory(response);
      }
    });

    // Listen for sync updates from background script
    const messageListener = (message: { type: string; success?: boolean; history?: HistoryEntry[] }) => {
      if (message.type === 'syncComplete') {
        setLastSync(new Date().toLocaleString());
      } else if (message.type === 'historyUpdated' && message.history) {
        setHistory(message.history);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Cleanup listener when component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleInitialize = () => {
    if (clientId) {
      // Save both clientId and initialized state
      chrome.storage.sync.set({
        clientId: clientId,
        initialized: true
      }, () => {
        setInitialized(true);
      });
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newClientId = e.target.value;
    setClientId(newClientId);
    // Save clientId as it changes
    chrome.storage.sync.set({ clientId: newClientId }, () => {});
  };

  const handleSync = () => {
    // Send message to background script to trigger sync
    chrome.runtime.sendMessage({ type: 'triggerSync' }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Sync failed: ' + chrome.runtime.lastError.message);
      } else if (response && response.error) {
        alert('Sync failed: ' + response.error);
      } else if (response && response.success) {
        alert(response.message || 'Sync successful');
      } else {
        alert('Sync initiated');
      }
    });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="app">
      <h1>ChronicleSync</h1>
      <div id="adminLogin">
        <h2>Admin Login</h2>
        <form>
          <input
            type="text"
            id="clientId"
            placeholder="Client ID"
            value={clientId}
            onChange={handleClientIdChange}
          />
          {!initialized ? (
            <button type="button" onClick={handleInitialize}>Initialize</button>
          ) : (
            <button type="button" onClick={handleSync}>Sync with Server</button>
          )}
        </form>
      </div>
      <div id="status" className="sync-status">
        Last sync: {lastSync}
      </div>
      <div id="history" className="history-list">
        <h2>Recent History</h2>
        <div className="history-entries">
          {history.map((entry) => (
            <div key={entry.url} className={`history-entry ${entry.syncStatus}`}>
              <div className="entry-title">{entry.title}</div>
              <div className="entry-url">{entry.url}</div>
              <div className="entry-meta">
                <span className="visit-count">Visits: {entry.visitCount}</span>
                <span className="last-visit">
                  Last visit: {new Date(entry.lastVisitTime).toLocaleString()}
                </span>
                <span className="sync-status">
                  Status: {entry.syncStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-link">
        <button type="button" onClick={openSettings}>Settings</button>
      </div>
    </div>
  );
}

// Only mount if we're in a browser environment
if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}