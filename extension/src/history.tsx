import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HistoryStore } from './db/HistoryStore';
import translate from 'translate';

const ITEMS_PER_PAGE = 10;

import { HistoryEntry } from './types';

// Configure translate defaults
const translateConfig = { engine: 'google', from: 'auto' };

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
  const [translatedItems, setTranslatedItems] = useState<Record<string, string>>({});
  const [summarizedItems, setSummarizedItems] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isSummarizing, setIsSummarizing] = useState<Record<string, boolean>>({});

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

  const handleTranslate = async (visitId: string, text: string, targetLang: string = 'en') => {
    try {
      setIsTranslating(prev => ({ ...prev, [visitId]: true }));
      const translated = await translate(text, { ...translateConfig, to: targetLang });
      setTranslatedItems(prev => ({ ...prev, [visitId]: translated }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(prev => ({ ...prev, [visitId]: false }));
    }
  };

  const handleSummarize = async (visitId: string, text: string) => {
    try {
      setIsSummarizing(prev => ({ ...prev, [visitId]: true }));
      const summary = await translate(text, { ...translateConfig, to: 'en' });
      const summarized = await translate(`Summarize this text in 2-3 sentences: ${summary}`, { ...translateConfig, to: 'en' });
      setSummarizedItems(prev => ({ ...prev, [visitId]: summarized }));
    } catch (error) {
      console.error('Summarization error:', error);
    } finally {
      setIsSummarizing(prev => ({ ...prev, [visitId]: false }));
    }
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
          >
            <div onClick={() => handleItemClick(item.url)} style={{ cursor: 'pointer' }}>
              <div>{item.title}</div>
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
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTranslate(item.visitId, item.title);
                }}
                disabled={isTranslating[item.visitId]}
                style={{ fontSize: '0.8em', padding: '4px 8px' }}
              >
                {isTranslating[item.visitId] ? 'Translating...' : 'Translate'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSummarize(item.visitId, item.title);
                }}
                disabled={isSummarizing[item.visitId]}
                style={{ fontSize: '0.8em', padding: '4px 8px' }}
              >
                {isSummarizing[item.visitId] ? 'Summarizing...' : 'Summarize'}
              </button>
            </div>
            {translatedItems[item.visitId] && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#2c5282', padding: '8px', backgroundColor: '#ebf8ff', borderRadius: '4px' }}>
                <strong>Translation:</strong> {translatedItems[item.visitId]}
              </div>
            )}
            {summarizedItems[item.visitId] && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#2c5282', padding: '8px', backgroundColor: '#f0fff4', borderRadius: '4px' }}>
                <strong>Summary:</strong> {summarizedItems[item.visitId]}
              </div>
            )}
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