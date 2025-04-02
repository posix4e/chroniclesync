import React, { useState, useEffect } from 'react';
import { API_URL, API_ENDPOINTS, getDefaultApiUrl, formatBytes } from '../utils/api';
import type { ClientStats } from '../types/index';

type ApiEnvironment = 'production' | 'staging' | 'local';

export function AdminPanel() {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [apiEnvironment, setApiEnvironment] = useState<ApiEnvironment>(() => {
    // Determine initial environment based on the default API URL
    const defaultUrl = getDefaultApiUrl();
    if (defaultUrl === API_ENDPOINTS.production) return 'production';
    if (defaultUrl === API_ENDPOINTS.staging) return 'staging';
    return 'local';
  });
  
  // Get the current API URL based on selected environment
  const getCurrentApiUrl = (): string => {
    return API_ENDPOINTS[apiEnvironment];
  };

  const refreshStats = async () => {
    try {
      const currentApiUrl = getCurrentApiUrl();
      const response = await fetch(`${currentApiUrl}/admin/clients`, {
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

  const deleteClient = async (clientId: string) => {
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
      return;
    }

    try {
      const currentApiUrl = getCurrentApiUrl();
      const response = await fetch(`${currentApiUrl}/admin/client?clientId=${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      const text = await response.text();
      alert(text || 'Client deleted successfully');
      refreshStats();
    } catch (error) {
      alert(`Error deleting client: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const viewClientData = async (clientId: string) => {
    try {
      const currentApiUrl = getCurrentApiUrl();
      const response = await fetch(`${currentApiUrl}?clientId=${clientId}`, {
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

  // Refresh stats when API environment changes
  useEffect(() => {
    refreshStats();
  }, [apiEnvironment]);
  
  // Initial load
  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div id="adminPanel">
      <h2>Admin Panel</h2>
      
      <div className="api-environment-selector mb-4">
        <label htmlFor="apiEnvironment" className="mr-2 font-medium">API Environment:</label>
        <select 
          id="apiEnvironment" 
          value={apiEnvironment}
          onChange={(e) => setApiEnvironment(e.target.value as ApiEnvironment)}
          className="p-2 border rounded"
        >
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="local">Local</option>
        </select>
        <div className="text-sm text-gray-600 mt-1">
          Current API URL: {getCurrentApiUrl()}
        </div>
      </div>
      
      <div className="admin-section">
        <h3>Client Data Management</h3>
        <button 
          onClick={refreshStats}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Refresh Stats
        </button>
        <table id="statsTable" className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Client ID</th>
              <th className="border p-2">Last Sync</th>
              <th className="border p-2">Data Size</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="border p-2 text-center">
                  No clients found or unable to connect to {getCurrentApiUrl()}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.clientId} className="hover:bg-gray-50">
                  <td className="border p-2">{client.clientId}</td>
                  <td className="border p-2">{new Date(client.lastSync).toLocaleString()}</td>
                  <td className="border p-2">{formatBytes(client.dataSize)}</td>
                  <td className="border p-2">
                    <button 
                      onClick={() => deleteClient(client.clientId)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => viewClientData(client.clientId)}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                    >
                      View Data
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}