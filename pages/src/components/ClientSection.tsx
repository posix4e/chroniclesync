import React, { useState } from 'react';
import { DB } from '../utils/db';
import { API_URL } from '../utils/api';

interface ClientSectionProps {
  db: DB;
  onClientIdChange?: (_: string) => void;
}

export function ClientSection({ db, onClientIdChange }: ClientSectionProps) {
  const [localClientId, setLocalClientId] = useState('');
  const [data, setData] = useState('{}');
  const [isInitialized, setIsInitialized] = useState(false);

  // Client ID is now handled by the App component

  const handleClientIdChange = (value: string) => {
    setLocalClientId(value);
    db.clientId = value;
    onClientIdChange?.(value);
  };

  const initializeClient = async () => {
    if (!localClientId) {
      alert('Please enter a client ID');
      return;
    }

    try {
      await db.init(localClientId);
      const initialData = await db.getData();
      setData(JSON.stringify(initialData, null, 2));
      setIsInitialized(true);
      await syncData();
    } catch (error) {
      alert(`Error initializing client: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const saveData = async () => {
    try {
      const parsedData = JSON.parse(data);
      await db.setData(parsedData);
      alert('Data saved locally');
    } catch (error) {
      alert(`Error saving data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const syncData = async () => {
    try {
      const currentData = await db.getData();
      const response = await fetch(`${API_URL}?clientId=${db.clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentData)
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      alert('Sync successful');
    } catch (error) {
      alert(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div id="clientSection">
      <h2>Client Data</h2>
      <div>
        <label htmlFor="clientId">Client ID:</label>
        <input
          type="text"
          id="clientId"
          value={localClientId}
          onChange={(e) => handleClientIdChange(e.target.value)}
          placeholder="Enter client ID"
        />
        <button onClick={initializeClient}>Initialize</button>
      </div>
      
      {isInitialized && (
        <div id="dataSection">
          <h3>Data</h3>
          <textarea
            id="dataInput"
            rows={10}
            cols={50}
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <br />
          <button onClick={saveData}>Save Data</button>
          <button onClick={syncData}>Sync with Server</button>
        </div>
      )}
    </div>
  );
}