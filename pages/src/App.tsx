import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';
import { HistoryView } from './components/HistoryView';
import { DB } from './utils/db';

const db = new DB();

export function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  return (
    <Router>
      <div className="container mx-auto px-4">
        <nav className="bg-gray-100 p-4 mb-6 rounded-lg">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            </li>
            <li>
              <Link to="/history" className="text-blue-600 hover:text-blue-800">History</Link>
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
          
          <Route path="/history" element={
            clientId ? (
              <HistoryView clientId={clientId} />
            ) : (
              <div className="text-center p-4">
                Please set your client ID on the home page first
              </div>
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}