import React, { useState, useEffect } from 'react';
import '../popup.css';
import { config } from './config';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already initialized
    chrome.runtime.sendMessage({ type: 'GET_CLIENT_ID' }, (response) => {
      if (response.clientId) {
        setClientId(response.clientId);
        setInitialized(true);
      }
    });
  }, []);

  const handleInitialize = async () => {
    if (!clientId) {
      setError('Please enter a Client ID');
      return;
    }

    try {
      // Verify client ID exists on server
      const response = await fetch(`${config.workerUrl}/api/client/${clientId}`);
      if (!response.ok) {
        setError('Invalid Client ID');
        return;
      }

      // Set client ID in extension
      chrome.runtime.sendMessage({ type: 'SET_CLIENT_ID', clientId }, (response) => {
        if (response.success) {
          setInitialized(true);
          setError('');
        } else {
          setError('Failed to initialize');
        }
      });
    } catch {
      setError('Failed to connect to server');
    }
  };

  const handleViewHistory = () => {
    chrome.tabs.create({
      url: `${config.workerUrl}/history/${clientId}`
    });
  };

  return (
    <div className="app">
      <h1>ChronicleSync</h1>
      <div id="adminLogin">
        <h2>History Sync</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            id="clientId"
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={initialized}
          />
          {!initialized ? (
            <button type="button" onClick={handleInitialize}>Initialize</button>
          ) : (
            <button type="button" onClick={handleViewHistory}>View History</button>
          )}
        </form>
      </div>
    </div>
  );
}

// Only mount if we're in a browser environment
if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    import('react-dom/client').then((ReactDOM) => {
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    });
  }
}