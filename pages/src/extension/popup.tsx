import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from '../components/AdminPanel';
import { ClientSection } from '../components/ClientSection';
import { HealthCheck } from '../components/HealthCheck';
import { DB } from '../utils/db';

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