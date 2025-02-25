import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';
import { EncryptionService } from './services/EncryptionService';
import { EncryptedHistoryEntry } from './types';

interface DecryptedHistoryEntry {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  platform: string;
  browserName: string;
}

const ITEMS_PER_PAGE = 10;

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<DecryptedHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DecryptedHistoryEntry[]>([]);
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
  }, [history, searchTerm]);

  const loadHistory = async () => {
    const settings = await chrome.storage.sync.get(['mnemonic']);
    const encryptionService = new EncryptionService();
    await encryptionService.init(settings.mnemonic);
    const historyStore = new HistoryStore(encryptionService);
    await historyStore.init();
    const encryptedItems = await historyStore.getEntries();

    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        try {
          const decryptedData = await encryptionService.decrypt(
            item.encryptedData.ciphertext,
            item.encryptedData.iv
          );
          const { url, title } = JSON.parse(decryptedData);
          return {
            visitId: item.visitId,
            url,
            title,
            visitTime: item.visitTime,
            platform: item.platform,
            browserName: item.browserName
          };
        } catch (error) {
          console.error('Error decrypting history entry:', error);
          return {
            visitId: item.visitId,
            url: '[Error: Could not decrypt]',
            title: '[Error: Could not decrypt]',
            visitTime: item.visitTime,
            platform: item.platform,
            browserName: item.browserName
          };
        }
      })
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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
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
            <div>{item.title || getDomain(item.url)}</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {getDomain(item.url)} • {new Date(item.visitTime).toLocaleString()}
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