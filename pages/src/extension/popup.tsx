import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from '../components/AdminPanel';
import { ClientSection } from '../components/ClientSection';
import { HealthCheck } from '../components/HealthCheck';
import '../styles.css';

const PopupApp = () => {
  return (
    <div className="popup-container">
      <h2>OpenHands History Sync</h2>
      <HealthCheck />
      <ClientSection />
      <AdminPanel />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<PopupApp />);