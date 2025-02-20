import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './HistoryViewer.css';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified?: number;
}

interface HistoryViewerProps {
  items: HistoryItem[];
  onSync?: () => void;
  loading?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 20;

export const HistoryViewer: React.FC<HistoryViewerProps> = ({
  items,
  onSync,
  loading = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) =>
      sortOrder === 'desc'
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp
    );

    setFilteredItems(sorted);
  }, [items, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const displayedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight) {
      if (page < totalPages) {
        setPage(page + 1);
      }
    }
  };

  return (
    <div className="history-viewer">
      <div className="history-viewer-header">
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="sort-button"
        >
          Sort {sortOrder === 'desc' ? '↓' : '↑'}
        </button>
        {onSync && (
          <button
            onClick={onSync}
            className="sync-button"
            disabled={loading}
          >
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="history-list" onScroll={handleScroll}>
        {displayedItems.map((item) => (
          <div key={item.id} className="history-item">
            <div className="history-item-header">
              <h3 className="history-item-title">{item.title}</h3>
              <span className={`sync-status ${item.syncStatus}`}>
                {item.syncStatus}
              </span>
            </div>
            <a href={item.url} className="history-item-url" target="_blank" rel="noopener noreferrer">
              {item.url}
            </a>
            <div className="history-item-footer">
              <span className="timestamp">
                {format(item.timestamp, 'PPpp')}
              </span>
              {item.lastModified && (
                <span className="last-modified">
                  Modified: {format(item.lastModified, 'PPpp')}
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="loading">Loading...</div>}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};