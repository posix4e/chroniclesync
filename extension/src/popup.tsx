import React, { useState } from 'react';
import '../popup.css';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState('');

  const handleInitialize = () => {
    if (clientId) {
      setInitialized(true);
    }
  };

  const handleSync = () => {
    alert('Sync successful');
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
            onChange={(e) => setClientId(e.target.value)}
          />
          {!initialized ? (
            <button type="button" onClick={handleInitialize}>Initialize</button>
          ) : (
            <button type="button" onClick={handleSync}>Sync with Server</button>
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