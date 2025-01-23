import React, { useState, useEffect } from 'react';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';
import { HistorySync } from './components/HistorySync';
import { DB } from './utils/db';

const db = new DB();

export function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const loadDeviceId = async () => {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get('deviceId');
        if (!result.deviceId) {
          const newDeviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          await chrome.storage.local.set({ deviceId: newDeviceId });
          setDeviceId(newDeviceId);
        } else {
          setDeviceId(result.deviceId);
        }
      }
    };

    loadDeviceId();
  }, []);

  return (
    <div className="container">
      <h1>ChronicleSync</h1>
      
      {deviceId && chrome?.storage?.local && (
        <HistorySync deviceId={deviceId} />
      )}
      
      <ClientSection db={db} />
      
      {!isAdminLoggedIn ? (
        <div id="adminLogin">
          <h2>Admin Login</h2>
          <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
        </div>
      ) : (
        <AdminPanel />
      )}
      
      <HealthCheck />
    </div>
  );
}