import React, { useState, useEffect } from 'react';
import '../popup.css';
import { getConfig } from '../config.js';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      const cfg = await getConfig();
      setConfig(cfg);
      setClientId(cfg.clientId);
      setInitialized(!!cfg.clientId);
    };
    loadConfig();
  }, []);

  const handleSync = () => {
    alert('Sync successful');
  };

  const openSettings = () => {
    const settingsUrl = chrome.runtime.getURL('settings.html');
    chrome.windows.create({
      url: settingsUrl,
      type: 'popup',
      width: 500,
      height: 600
    });
  };

  return (
    <div className="app">
      <h1>ChronicleSync</h1>
      <div id="adminLogin">
        <h2>Admin Login</h2>
        <div className="status">
          {config && (
            <div>
              <p>Client ID: {config.clientId}</p>
              <p>API: {config.apiEndpoint}</p>
            </div>
          )}
        </div>
        <div className="actions">
          <button type="button" onClick={handleSync} disabled={!initialized}>
            Sync with Server
          </button>
          <button type="button" onClick={openSettings} className="settings-btn">
            Settings
          </button>
        </div>
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