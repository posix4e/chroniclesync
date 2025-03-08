import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '../types';

interface SearchHistoryProps {
  onClose?: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'searchHistory',
        query: searchQuery,
        limit: 20
      });

      if (response.error) {
        setError(response.error);
        setSearchResults([]);
      } else {
        setSearchResults(response);
      }
    } catch (err) {
      setError('Failed to search history. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="search-history-container">
      <div className="search-header">
        <h2>Semantic Search</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search your browsing history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button 
          className="search-button"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-results">
        {searchResults.length === 0 ? (
          <div className="no-results">
            {searchQuery.trim() ? 'No results found' : 'Enter a search term to find pages in your history'}
          </div>
        ) : (
          <ul className="results-list">
            {searchResults.map((entry) => (
              <li key={entry.visitId} className="result-item">
                <div className="result-title">
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    {entry.title || entry.url}
                  </a>
                </div>
                <div className="result-url">{entry.url}</div>
                <div className="result-summary">
                  {entry.pageSummary || 'No summary available'}
                </div>
                <div className="result-meta">
                  <span className="result-date">{formatDate(entry.visitTime)}</span>
                  <span className="result-device">{entry.browserName} on {entry.platform}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;