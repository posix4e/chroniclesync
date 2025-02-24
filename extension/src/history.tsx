import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';

const ITEMS_PER_PAGE = 10;

import { HistoryEntry } from './types';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadHistory = async () => {
      const historyStore = new HistoryStore();
      await historyStore.init();
      const items = await historyStore.getEntries(1000);
      setHistory(items.sort((a, b) => b.visitTime - a.visitTime));
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const filtered = history.filter(item => 
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHistory(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, history]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getCurrentPageItems = () => {
    const sortedHistory = [...filteredHistory].sort((a, b) => b.visitTime - a.visitTime);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedHistory.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Browsing History</h2>
        <input
          type="text"
          className="history-search"
          placeholder="Search history..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="history-list">
        {getCurrentPageItems().map(item => (
          <div key={item.visitId} className="history-item">
            <div className="history-item-title"><strong>{item.title || 'Untitled'}</strong></div>
            <div className="history-item-url">{item.url}</div>
            <div className="history-item-date">{formatDate(item.visitTime)}</div>
            <div className="history-item-status">Status: {item.syncStatus}</div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<HistoryView />);