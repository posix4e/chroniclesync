import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';
import { EncryptionService } from './services/Encryption';

const ITEMS_PER_PAGE = 10;
const DEFAULT_SEED = 'chroniclesync-default-seed'; // TODO: Get from settings

import { HistoryEntry } from './types';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const filtered = history.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHistory(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, history]);

  const loadHistory = async () => {
    try {
      const encryptionService = new EncryptionService();
      const historyStore = new HistoryStore(encryptionService);
      await historyStore.initializeEncryption(DEFAULT_SEED);
      await historyStore.init();
      const items = await historyStore.getEntries();
      setHistory(items.sort((a, b) => b.visitTime - a.visitTime));
    } catch (error) {
      console.error('Failed to load history:', error);
      // TODO: Show error to user
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Browsing History</h2>
      </div>
      <input
        type="text"
        className="history-search"
        placeholder="Search history..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <div className="history-list">
        {getCurrentPageItems().map(item => (
          <div
            key={item.visitId}
            className="history-item"
            onClick={() => handleItemClick(item.url)}
          >
            <div>{item.title}</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {item.url}
              <br />
              {new Date(item.visitTime).toLocaleString()}
            </div>
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
        <span>
          Page {currentPage} of {totalPages}
        </span>
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

const root = createRoot(document.getElementById('root')!);
root.render(<HistoryView />);