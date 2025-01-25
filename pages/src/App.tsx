import React, { useState } from 'react';
import { ClientSection } from './components/ClientSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { HealthCheck } from './components/HealthCheck';
import HistoryView from './components/HistoryView';
import { DB } from './utils/db';

const db = new DB();

export function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('sync');

  return (
    <div className="container">
      <h1>ChronicleSync</h1>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          Sync
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'sync' ? (
        <>
          <ClientSection db={db} />
          
          {!isAdminLoggedIn ? (
            <div id="adminLogin">
              <h2>Admin Login</h2>
              <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
            </div>
          ) : (
            <AdminPanel />
          )}
        </>
      ) : (
        <HistoryView />
      )}
      
      <HealthCheck />

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: none;
          cursor: pointer;
        }

        .tab.active {
          background: #0066cc;
          color: white;
          border-color: #0066cc;
        }

        .tab:hover {
          background: #f0f0f0;
        }

        .tab.active:hover {
          background: #0055aa;
        }
      `}</style>
    </div>
  );
}