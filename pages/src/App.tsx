import React, { useState } from 'react';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';
import { DB } from './utils/db';

const db = new DB();

export function App(): JSX.Element {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <div className="container">
      <h1>ChronicleSync</h1>
      
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