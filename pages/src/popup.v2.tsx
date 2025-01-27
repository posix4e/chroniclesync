import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

function Popup() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string>('Never');

  const handleManualSync = async () => {
    setStatus('syncing');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'sync' });
      if (response.success) {
        setStatus('idle');
        setLastSync(new Date().toLocaleTimeString());
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="popup">
      <h2>ChronicleSync</h2>
      <div className="status">
        <p>Last sync: {lastSync}</p>
        <p>Status: {status}</p>
      </div>
      <button 
        onClick={handleManualSync}
        disabled={status === 'syncing'}
      >
        {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

ReactDOM.render(<Popup />, document.getElementById('root'));