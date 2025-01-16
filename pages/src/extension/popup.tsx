import React from 'react';
const { useState } = React;
const { createRoot } = ReactDOM;
import { AdminPanel } from '../components/AdminPanel';
import { ClientSection } from '../components/ClientSection';
import { HealthCheck } from '../components/HealthCheck';
import { DB } from '../utils/db';
import '../styles.css';

const PopupApp = (): JSX.Element => {
  const [db] = useState(() => new DB());

  return (
    <div className="popup-container">
      <h2>OpenHands History Sync</h2>
      <HealthCheck />
      <ClientSection db={db} />
      <AdminPanel />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<PopupApp />);