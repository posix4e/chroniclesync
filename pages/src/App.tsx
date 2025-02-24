import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';

import { DB } from './utils/db';
import { getClientIdFromExtension } from './utils/extension-messaging';

const db = new DB();

export function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadExtensionClientId = async () => {
      // Only try to get the client ID if we don't already have one
      if (!clientId) {
        const extensionClientId = await getClientIdFromExtension();
        if (extensionClientId) {
          setClientId(extensionClientId);
          db.clientId = extensionClientId;
        }
      }
    };

    // Load client ID when the component mounts
    loadExtensionClientId();
  }, [clientId, db]);

  return (
    <Router>
      <div className="container mx-auto px-4">
        <nav className="bg-gray-100 p-4 mb-6 rounded-lg">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={
            <div>
              <h1 className="text-3xl font-bold mb-6">ChronicleSync</h1>
              
              <ClientSection db={db} onClientIdChange={setClientId} />
              
              {!isAdminLoggedIn ? (
                <div id="adminLogin" className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
                  <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
                </div>
              ) : (
                <AdminPanel />
              )}
              
              <HealthCheck />
            </div>
          } />
          

        </Routes>
      </div>
    </Router>
  );
}