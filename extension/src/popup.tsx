import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [debugMode, setDebugMode] = useState(false);
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
      } else {
        alert('Sync initiated');
      }
    });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };
  
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };
  
  const triggerSummarization = async () => {
    try {
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0 || !tabs[0].id || !tabs[0].url) {
        alert('No active tab found');
        return;
      }
      
      const activeTab = tabs[0];
      
      // Get the visit ID for this tab
      if (activeTab.url) {
        const visits = await chrome.history.getVisits({ url: activeTab.url });
        if (!visits || visits.length === 0) {
          alert('No visit history found for this tab');
          return;
        }
        
        const latestVisit = visits[visits.length - 1];
        
        // Send message to background script to trigger summarization
        chrome.runtime.sendMessage({ 
          type: 'summarizeEntry',
          tabId: activeTab.id,
          visitId: latestVisit.visitId
      }, (response) => {
          if (chrome.runtime.lastError) {
            alert('Summarization failed: ' + chrome.runtime.lastError.message);
          } else if (response && response.error) {
            alert('Summarization failed: ' + response.error);
          } else {
            alert('Summarization triggered for current tab. Check the background page console for logs.');
          }
        });
      } else {
        alert('No URL found for current tab');
      }
    } catch (error) {
      alert('Error triggering summarization: ' + (error instanceof Error ? error.message : String(error)));
    }
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
      <div className="action-buttons">
        <button type="button" onClick={openHistory}>View History</button>
        <button type="button" onClick={openSettings}>Settings</button>
        <button type="button" onClick={toggleDebugMode}>
          {debugMode ? "Hide Debug" : "Show Debug"}
        </button>
      </div>
      
      {debugMode && (
        <div className="debug-section">
          <h3>Debug Tools</h3>
          <button 
            type="button" 
            onClick={triggerSummarization}
            className="debug-button"
          >
            Summarize Current Tab
          </button>
          <p className="debug-info">
            To see summarization logs, open the background page console from the extension management page.
          </p>
        </div>
      )}
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