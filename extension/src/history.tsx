import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';

const ITEMS_PER_PAGE = 10;

import { HistoryEntry } from './types';

interface FilterOptions {
  platform: string;
  browserName: string;
}

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({ platform: '', browserName: '' });
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [availableBrowsers, setAvailableBrowsers] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      const platforms = [...new Set(history.map(item => item.platform))];
      const browsers = [...new Set(history.map(item => item.browserName))];
      setAvailablePlatforms(platforms);
      setAvailableBrowsers(browsers);
    }
  }, [history]);

  useEffect(() => {
    const filtered = history.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = filters.platform === '' || 
        item.platform === filters.platform;
      
      const matchesBrowser = filters.browserName === '' || 
        item.browserName === filters.browserName;

      return matchesSearch && matchesPlatform && matchesBrowser;
    });
    
    setFilteredHistory(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [searchTerm, filters, history]);

  const loadHistory = async () => {
    const historyStore = new HistoryStore();
    await historyStore.init();
    const items = await historyStore.getEntries();
    setHistory(items.sort((a, b) => b.visitTime - a.visitTime));
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (type: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
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
      <div className="history-filters">
        <input
          type="text"
          className="history-search"
          placeholder="Search history..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <div className="filter-controls">
          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="platform-filter"
          >
            <option value="">All Platforms</option>
            {availablePlatforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
          <select
            value={filters.browserName}
            onChange={(e) => handleFilterChange('browserName', e.target.value)}
            className="browser-filter"
          >
            <option value="">All Browsers</option>
            {availableBrowsers.map(browser => (
              <option key={browser} value={browser}>{browser}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="history-list">
        {getCurrentPageItems().map(item => (
          <div
            key={item.visitId}
            className="history-item"
            onClick={() => handleItemClick(item.url)}
          >
            <div>{item.title}</div>
            {item.summary && (
              <div className="history-item-summary">
                {item.summary}
              </div>
            )}
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {item.url}
              <br />
              {new Date(item.visitTime).toLocaleString()}
              <br />
              <span style={{ color: '#888' }}>
                {item.platform} • {item.browserName}
              </span>
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