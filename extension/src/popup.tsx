import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ status: string; lastSync?: number; error?: string }>({ status: 'not_initialized' });
  const [environment, setEnvironment] = useState('production');

  // Load saved state when component mounts
  useEffect(() => {
    const loadState = () => {
      chrome.storage.local.get(['clientId', 'initialized', 'environment'], (result) => {
        if (result.clientId) {
          setClientId(result.clientId);
        }
        if (result.initialized) {
          setInitialized(result.initialized);
        }
        if (result.environment) {
          setEnvironment(result.environment);
        }
      });
    };

    loadState();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local') {
        loadState();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Poll for sync status
  useEffect(() => {
    if (!initialized) return;

    const pollStatus = () => {
      chrome.runtime.sendMessage({ type: 'getHistoryStatus' }, (response) => {
        setSyncStatus(response);
      });
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [initialized]);

  const handleInitialize = () => {
    if (clientId) {
      // Save both clientId and initialized state
      chrome.storage.local.set({
        clientId: clientId,
        initialized: true,
        environment: environment
      }, () => {
        setInitialized(true);
      });
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newClientId = e.target.value;
    setClientId(newClientId);
    // Save clientId as it changes
    chrome.storage.local.set({ clientId: newClientId }, () => {});
  };

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnvironment = e.target.value;
    setEnvironment(newEnvironment);
    chrome.storage.local.set({ environment: newEnvironment }, () => {});
  };

  const handleSync = () => {
    chrome.runtime.sendMessage({ type: 'forceSync' }, (response) => {
      if (response.success) {
        alert('Sync successful');
      } else {
        alert(`Sync failed: ${response.error}`);
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
          <div className="form-group">
            <input
              type="text"
              id="clientId"
              placeholder="Client ID"
              value={clientId}
              onChange={handleClientIdChange}
            />
          </div>
          <div className="form-group">
            <select
              id="environment"
              value={environment}
              onChange={handleEnvironmentChange}
              disabled={initialized}
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
            </select>
          </div>
          {!initialized ? (
            <button type="button" onClick={handleInitialize}>Initialize</button>
          ) : (
            <>
              <button type="button" onClick={handleSync}>Sync with Server</button>
              <div className="sync-status" data-testid="sync-status">
                <p>Status: {syncStatus.status}</p>
                {syncStatus.lastSync && (
                  <p>Last sync: {new Date(syncStatus.lastSync).toLocaleString()}</p>
                )}
                {syncStatus.error && (
                  <p className="error" data-testid="sync-error">Error: {syncStatus.error}</p>
                )}
              </div>
            </>
          )}
        </form>
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