import React, { useState, useEffect } from 'react';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';
import { BrowserHistory } from './components/BrowserHistory';
import { DB } from './utils/db';

const db = new DB();

export function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      setClientId(storedClientId);
    }
  }, []);

  return (
    <div className="container">
      <h1>ChronicleSync</h1>
      
      {!clientId ? (
        <ClientSection db={db} onClientIdSet={(id) => {
          setClientId(id);
          localStorage.setItem('clientId', id);
        }} />
      ) : (
        <BrowserHistory clientId={clientId} />
      )}
      
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