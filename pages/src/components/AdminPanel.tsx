import React, { useState, useEffect } from 'react';
import { API_URL, formatBytes } from '../utils/api';
import type { ClientStats } from '../types/index';

export function AdminPanel(): JSX.Element {
  const [clients, setClients] = useState<ClientStats[]>([]);

  const refreshStats = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/admin/clients`, {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const stats = await response.json();
      setClients(stats);
    } catch (error) {
      alert(`Error fetching stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const deleteClient = async (clientId: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/client?clientId=${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      await response.json();
      alert('Client deleted successfully');
      refreshStats();
    } catch (error) {
      alert(`Error deleting client: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const viewClientData = async (clientId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}?clientId=${clientId}`, {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }

      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      alert(`Error fetching client data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div id="adminPanel">
      <h2>Admin Panel</h2>
      <div className="admin-section">
        <h3>Client Data Management</h3>
        <button onClick={refreshStats}>Refresh Stats</button>
        <table id="statsTable">
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Last Sync</th>
              <th>Data Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.clientId}>
                <td>{client.clientId}</td>
                <td>{new Date(client.lastSync).toLocaleString()}</td>
                <td>{formatBytes(client.dataSize)}</td>
                <td>
                  <button onClick={() => deleteClient(client.clientId)}>Delete</button>
                  <button onClick={() => viewClientData(client.clientId)}>View Data</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}