import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

import { HistoryEntry } from './types';
import { EncryptionManager } from './utils/encryption';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionManager] = useState(() => new EncryptionManager());

  const loadHistory = async () => {
    console.log('Loading history...');
    setIsLoading(true);
    setHistoryError(null);

    try {
      const response = await new Promise<HistoryEntry[]>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timed out. Please try again.'));
        }, 5000);

        chrome.runtime.sendMessage({ type: 'getHistory', limit: 50 }, (response) => {
          clearTimeout(timeoutId);

          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
            return;
          }

          if (response?.error) {
            reject(new Error(response.error));
            return;
          }

          if (!response || !Array.isArray(response)) {
            resolve([]);
            return;
          }

          resolve(response);
        });
      });

      console.log('Received history response:', response);
      setHistory(response);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistoryError(error instanceof Error ? error.message : 'Unknown error');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved state and history when component mounts
  useEffect(() => {
    const initializePopup = async () => {
      try {
        // Load settings from storage
        const result = await new Promise<{ clientId?: string; initialized?: boolean; lastSync?: string }>(resolve => {
          chrome.storage.sync.get(['clientId', 'initialized', 'lastSync'], items => {
            resolve(items as { clientId?: string; initialized?: boolean; lastSync?: string });
          });
        });

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

        // Load history
        await loadHistory();
      } catch (error) {
        console.error('Error initializing popup:', error);
        setHistoryError('Failed to initialize. Please try again.');
      }
    };

    initializePopup();

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
          {isLoading ? (
            <div className="history-loading">Loading history...</div>
          ) : historyError ? (
            <div className="history-error">
              <div className="error-message">{historyError}</div>
              <button onClick={loadHistory} className="retry-button">Retry</button>
            </div>
          ) : history && history.length > 0 ? (
            history.map((entry) => (
              <div key={entry.visitId} className={`history-entry ${entry.syncStatus}`}>
                <div className="entry-title">
                  {typeof entry.title === 'string' ? entry.title : 'Encrypted'}
                </div>
                <div className="entry-url">
                  {typeof entry.url === 'string' ? entry.url : 'Encrypted'}
                </div>
                <div className="entry-meta">
                  <span className="visit-time">
                    Visit time: {new Date(entry.visitTime).toLocaleString()}
                  </span>
                  <span className={`sync-status ${entry.syncStatus}`}>
                    {entry.syncStatus === 'pending' ? 'Pending sync' :
                      entry.syncStatus === 'synced' ? 'Synced' :
                        entry.syncStatus === 'error' ? 'Sync failed' : 'Unknown'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <div className="empty-message">No history entries yet</div>
              <button onClick={loadHistory} className="refresh-button">Refresh</button>
            </div>
          )}
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