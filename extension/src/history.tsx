import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';
import { EncryptionService } from './services/EncryptionService';
import { EncryptedHistoryEntry } from './types';

const ITEMS_PER_PAGE = 10;

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<EncryptedHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<EncryptedHistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    // With encrypted data, we can't filter by content
    setFilteredHistory(history);
    setTotalPages(Math.ceil(history.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [history]);

  const loadHistory = async () => {
    const settings = await chrome.storage.sync.get(['mnemonic']);
    const encryptionService = new EncryptionService();
    await encryptionService.init(settings.mnemonic);
    const historyStore = new HistoryStore(encryptionService);
    await historyStore.init();
    const items = await historyStore.getEntries();
    setHistory(items.sort((a, b) => b.visitTime - a.visitTime));
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

  const handleItemClick = async (item: EncryptedHistoryEntry) => {
    const settings = await chrome.storage.sync.get(['mnemonic']);
    const encryptionService = new EncryptionService();
    await encryptionService.init(settings.mnemonic);
    const decryptedData = await encryptionService.decrypt(
      item.encryptedData.ciphertext,
      item.encryptedData.iv
    );
    const { url } = JSON.parse(decryptedData);
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
            onClick={() => handleItemClick(item)}
          >
            <div>[Encrypted Entry]</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              [Click to open]
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