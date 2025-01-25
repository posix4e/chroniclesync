import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../services/history';

interface HistoryListProps {
  onDelete: (id: string) => Promise<void>;
  onClear: () => Promise<void>;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onDelete, onClear }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
      if (response.history) {
        setHistory(response.history);
      }
    };
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setHistory(history.filter(item => item.id !== id));
  };

  const handleClear = async () => {
    await onClear();
    setHistory([]);
    setShowConfirm(false);
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Browsing History</h2>
        <button
          data-testid="clear-history"
          onClick={() => setShowConfirm(true)}
          className="clear-button"
        >
          Clear All
        </button>
      </div>

      {showConfirm && (
        <div className="confirm-dialog">
          <p>Are you sure you want to clear all history?</p>
          <div className="confirm-buttons">
            <button
              data-testid="confirm-clear"
              onClick={handleClear}
              className="confirm-button"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div data-testid="history-list" className="history-list">
        {history.map(item => (
          <div
            key={item.id}
            data-testid="history-item"
            className="history-item"
          >
            <div className="history-item-content">
              <div className="history-item-title">{item.title}</div>
              <div data-testid="history-url" className="history-item-url">
                {item.url}
              </div>
              <div className="history-item-meta">
                Visited {new Date(item.lastVisitTime).toLocaleString()} (
                {item.visitCount} times)
              </div>
            </div>
            <button
              data-testid="delete-history-item"
              onClick={() => handleDelete(item.id)}
              className="delete-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};