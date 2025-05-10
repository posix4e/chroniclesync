import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

interface P2PStatus {
  enabled: boolean;
  connected: boolean;
  peers: string[];
}

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [syncMode, setSyncMode] = useState<'server' | 'p2p'>('server');
  const [p2pStatus, setP2PStatus] = useState<P2PStatus>({ enabled: false, connected: false, peers: [] });
  const openHistory = () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('history.html'),
      type: 'popup',
      width: 500,
      height: 600
    });
  };

  // Load saved state and history when component mounts
  useEffect(() => {
    const initializePopup = async () => {
      try {
        // Load settings from storage
        const result = await new Promise<{ 
          clientId?: string; 
          initialized?: boolean; 
          lastSync?: string;
          syncMode?: 'server' | 'p2p';
        }>(resolve => {
          chrome.storage.sync.get(['clientId', 'initialized', 'lastSync', 'syncMode'], items => {
            resolve(items as { 
              clientId?: string; 
              initialized?: boolean; 
              lastSync?: string;
              syncMode?: 'server' | 'p2p';
            });
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
        if (result.syncMode) {
          setSyncMode(result.syncMode);
        }

        // Get P2P status if in p2p mode
        if (result.syncMode === 'p2p') {
          chrome.runtime.sendMessage({ type: 'getP2PStatus' }, (response) => {
            if (response && !response.error) {
              setP2PStatus(response);
            }
          });
        }

      } catch (error) {
        console.error('Error initializing popup:', error);
      }
    };

    initializePopup();

    // Listen for sync updates from background script
    const messageListener = (message: { type: string; success?: boolean; lastSync?: string }) => {
      if (message.type === 'syncComplete') {
        if (message.lastSync) {
          setLastSync(message.lastSync);
        } else {
          setLastSync(new Date().toLocaleString());
        }
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
        
        // Update P2P status if in p2p mode
        if (syncMode === 'p2p') {
          chrome.runtime.sendMessage({ type: 'getP2PStatus' }, (statusResponse) => {
            if (statusResponse && !statusResponse.error) {
              setP2PStatus(statusResponse);
            }
          });
        }
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
            <button type="button" onClick={handleSync}>
              {syncMode === 'p2p' ? 'Sync with Peers' : 'Sync with Server'}
            </button>
          )}
        </form>
      </div>
      <div id="status" className="sync-status">
        Last sync: {lastSync}
        {syncMode === 'p2p' && (
          <div className="p2p-status">
            <p>P2P Mode: {p2pStatus.connected ? 'Connected' : 'Disconnected'}</p>
            {p2pStatus.connected && p2pStatus.peers.length > 0 && (
              <p>Connected to {p2pStatus.peers.length} peer(s)</p>
            )}
          </div>
        )}
      </div>
      <div className="action-buttons">
        <button type="button" onClick={openHistory}>View History</button>
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