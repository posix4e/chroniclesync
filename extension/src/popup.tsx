import React, { useState } from 'react';
import '../popup.css';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [pagesUrl, setPagesUrl] = useState('');

  const handleInitialize = () => {
    if (clientId) {
      setInitialized(true);
      // Set staging pages URL
      setPagesUrl('https://pages-staging.chroniclesync.xyz');
    }
  };

  const handleSync = async () => {
    try {
      // Get browser history
      const history = await chrome.history.search({
        text: '',
        startTime: 0,
        maxResults: 100
      });

      // Format history data
      const historyData = history.map(entry => ({
        url: entry.url,
        title: entry.title,
        timestamp: new Date(entry.lastVisitTime || 0).toISOString()
      }));

      // Send history to staging API
      const response = await fetch('https://api-staging.chroniclesync.xyz/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': clientId
        },
        body: JSON.stringify(historyData)
      });

      if (!response.ok) {
        throw new Error('Failed to sync history');
      }

      const result = await response.json();
      if (result.success) {
        alert('Sync successful');
      } else {
        throw new Error('Failed to sync history');
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      alert('Sync failed: ' + (error.message || 'Unknown error'));
    }
  };

  const [successMessage, setSuccessMessage] = useState('');

  const handleSaveSettings = () => {
    if (clientId) {
      setShowSettings(false);
      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="app">
      <h1>ChronicleSync</h1>
      {successMessage && (
        <div className="message success-message" role="alert">
          {successMessage}
        </div>
      )}
      <div className="nav-buttons">
        {initialized && (
          <button 
            type="button" 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            Settings
          </button>
        )}
      </div>
      
      {!initialized && (
        <div id="adminLogin">
          <h2>Admin Login</h2>
          <form>
            <input
              type="text"
              id="clientId"
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <button type="button" onClick={handleInitialize}>Initialize</button>
          </form>
        </div>
      )}

      {initialized && !showSettings && (
        <div id="syncPanel">
          <button type="button" onClick={handleSync}>Sync with Server</button>
          <input
            type="text"
            id="pagesUrl"
            value={pagesUrl}
            readOnly
            style={{ marginTop: '10px', width: '100%' }}
          />
        </div>
      )}

      {showSettings && (
        <div id="settings">
          <h2>Settings</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }}>
            <input
              type="text"
              id="clientId"
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <button type="submit">Save Settings</button>
          </form>
        </div>
      )}
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