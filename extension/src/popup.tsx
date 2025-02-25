import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [summary, setSummary] = useState<string>('');
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
    const messageListener = (message: { type: string; success?: boolean }) => {
      if (message.type === 'syncComplete') {
        setLastSync(new Date().toLocaleString());
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

  const handleSummarize = async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Execute script to get page content
      const [{result}] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const article = document.querySelector('article');
          if (article) return article.textContent;
          return document.body.textContent;
        }
      });

      if (!result) {
        setSummary('No content found to summarize');
        return;
      }

      // Send content to background script for summarization
      chrome.runtime.sendMessage({ 
        type: 'summarizeText', 
        text: result 
      }, (response) => {
        if (chrome.runtime.lastError) {
          setSummary('Error: ' + chrome.runtime.lastError.message);
        } else if (response.error) {
          setSummary('Error: ' + response.error);
        } else {
          setSummary(response.summary);
        }
      });
    } catch (error) {
      setSummary('Error: ' + (error instanceof Error ? error.message : String(error)));
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
        <button type="button" onClick={handleSummarize}>Summarize Page</button>
      </div>
      {summary && (
        <div className="summary">
          <h3>Summary</h3>
          <p>{summary}</p>
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