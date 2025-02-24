import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';

import { HistoryEntry } from './types';

const HistoryView: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const loadHistory = useCallback(async () => {
    const historyStore = new HistoryStore();
    const offset = (page - 1) * itemsPerPage;
    
    const { entries: historyEntries, total } = await historyStore.getEntries({
      offset,
      limit: itemsPerPage,
      searchTerm
    });

    setEntries(historyEntries);
    setTotalPages(Math.ceil(total / itemsPerPage));
  }, [page, itemsPerPage, searchTerm]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEntryClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Browsing History</h2>
      </div>
      
      <div className="history-filters">
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="history-list">
        {entries.map((entry) => (
          <div
            key={entry.visitId}
            className="history-item"
            onClick={() => handleEntryClick(entry.url)}
          >
            <div>{entry.title}</div>
            <div>{new Date(entry.visitTime).toLocaleString()}</div>
            <div>{entry.url}</div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<HistoryView />);