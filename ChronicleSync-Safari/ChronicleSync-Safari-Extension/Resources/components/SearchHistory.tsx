import React, { useState } from 'react';
import { SearchResult } from '../types';

interface SearchHistoryProps {
  onSearchComplete: (results: SearchResult[]) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'searchHistory',
        query: query.trim()
      });
      
      if (response.error) {
        setError(response.error);
      } else if (response.success) {
        onSearchComplete(response.results);
      }
    } catch (err) {
      setError('Failed to search history: ' + String(err));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search page content..."
            className="search-input"
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <div className="search-error">{error}</div>}
      </form>
    </div>
  );
};

interface SearchResultsProps {
  results: SearchResult[];
  onClearResults: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onClearResults }) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h3>Search Results ({results.length})</h3>
        <button onClick={onClearResults} className="clear-results-button">Clear Results</button>
      </div>
      
      <div className="search-results-list">
        {results.map((result) => (
          <div key={result.visitId} className="search-result-item">
            <div className="search-result-title">
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                {result.title || result.url}
              </a>
              <span className="search-result-time">
                {new Date(result.visitTime).toLocaleString()}
              </span>
            </div>
            
            <div className="search-result-matches">
              {result.matches.slice(0, 3).map((match, index) => (
                <div key={index} className="search-result-match">
                  <div className="search-result-context">
                    {match.context.replace(match.text, `<mark>${match.text}</mark>`)}
                  </div>
                </div>
              ))}
              {result.matches.length > 3 && (
                <div className="search-result-more">
                  +{result.matches.length - 3} more matches
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};