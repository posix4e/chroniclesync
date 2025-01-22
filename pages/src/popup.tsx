import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DB } from './utils/db';
import './styles.css';

// Create and expose DB instance for testing
const db = new DB();
window.chronicleSync = { db };

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}