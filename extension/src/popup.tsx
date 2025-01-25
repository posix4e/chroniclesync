import React from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryList } from './components/HistoryList';
import './styles/history.css';

const Popup: React.FC = () => {
  const handleDelete = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_HISTORY_ITEM', id });
  };

  const handleClear = async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
  };

  return (
    <div className="popup-container">
      <h1>ChronicleSync</h1>
      <HistoryList onDelete={handleDelete} onClear={handleClear} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);