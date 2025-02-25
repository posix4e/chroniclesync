import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../popup.css';
import { AITextProcessor } from './components/AITextProcessor';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lastSync, setLastSync] = useState<string>('Never');
  const [textToSummarize, setTextToSummarize] = useState('');
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
        const result = await new Promise<{ clientId?: string; initialized?: boolean; lastSync?: string; textToSummarize?: string }>(resolve => {
          chrome.storage.sync.get(['clientId', 'initialized', 'lastSync'], items => {
            resolve(items as { clientId?: string; initialized?: boolean; lastSync?: string; textToSummarize?: string });
          });
        });

        // Also get the text to summarize from local storage
        const localResult = await new Promise<{ textToSummarize?: string }>(resolve => {
          chrome.storage.local.get(['textToSummarize'], items => {
            resolve(items as { textToSummarize?: string });
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

        if (localResult.textToSummarize) {
          setTextToSummarize(localResult.textToSummarize);
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
      </div>

      <div className="summarization-section">
        <h2>Text Summarization</h2>
        <button
          type="button"
          onClick={async () => {
            // Get the active tab's text content
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  // Get all text content from the page
                  return document.body.innerText;
                }
              }, (results) => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                  return;
                }
                if (results && results[0]) {
                  const text = results[0].result;
                  // Store the text in chrome.storage for the summary component to access
                  chrome.storage.local.set({ textToSummarize: text });
                }
              });
            }
          }}
        >
          Summarize Current Page
        </button>
        <AITextProcessor 
          text={textToSummarize}
          mode="summarize"
        />
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