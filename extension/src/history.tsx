import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';

const ITEMS_PER_PAGE = 10;

import { PlainHistoryEntry } from './types';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<PlainHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PlainHistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyStore] = useState(() => new HistoryStore());

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
    await historyStore.init();
    const encryptedItems = await historyStore.getEntries();
    const decryptedItems = await Promise.all(
      encryptedItems.map(item => historyStore.decryptEntry(item))
    );
    setHistory(decryptedItems.sort((a, b) => b.visitTime - a.visitTime));
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