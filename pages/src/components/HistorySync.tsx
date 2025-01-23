import React, { useState } from 'react';

interface HistorySyncProps {
  deviceId: string;
}

export function HistorySync({ deviceId }: HistorySyncProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_HISTORY',
        deviceId
      });
      
      if (response.success) {
        alert(response.message);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      alert('Failed to sync history: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="history-sync">
      <h2>Browser History Sync</h2>
      <p>Device ID: {deviceId}</p>
      <button
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? 'Syncing...' : 'Sync History'}
      </button>
    </div>
  );
}