import React, { useState, useEffect } from 'react';
import '../popup.css';
import { getConfig, setConfig } from './configStore';

export function App() {
  const [clientId, setClientId] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [pagesEndpoint, setPagesEndpoint] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load initial values
    chrome.storage.local.get('clientId', (result) => {
      if (result.clientId) {
        setClientId(result.clientId);
      }
    });

    getConfig().then((config) => {
      setApiEndpoint(config.apiEndpoint);
      setPagesEndpoint(config.pagesEndpoint);
    });
  }, []);

  const handleSave = async () => {
    setStatus('saving');
    try {
      await chrome.storage.local.set({ clientId });
      await setConfig({
        apiEndpoint,
        pagesEndpoint
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings');
    }
    setStatus('idle');
  };

  const handleViewHistory = () => {
    if (!clientId) {
      setMessage('Please set a client ID first');
      return;
    }
    window.open(`${pagesEndpoint}?clientId=${clientId}`, '_blank');
  };

  return (
    <div className="app">
      <h1>ChronicleSync</h1>
      
      <div className="form-group">
        <label htmlFor="clientId">Client ID:</label>
        <input
          type="text"
          id="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Enter your client ID"
        />
      </div>

      <div className="form-group">
        <label htmlFor="apiEndpoint">API Endpoint:</label>
        <input
          type="text"
          id="apiEndpoint"
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          placeholder="https://api.chroniclesync.xyz"
        />
      </div>

      <div className="form-group">
        <label htmlFor="pagesEndpoint">Pages Endpoint:</label>
        <input
          type="text"
          id="pagesEndpoint"
          value={pagesEndpoint}
          onChange={(e) => setPagesEndpoint(e.target.value)}
          placeholder="https://chroniclesync.xyz"
        />
      </div>

      <div className="buttons">
        <button 
          onClick={handleSave}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? 'Saving...' : 'Save Settings'}
        </button>
        <button onClick={handleViewHistory}>View History</button>
      </div>

      {message && (
        <div className="message">
          {message}
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