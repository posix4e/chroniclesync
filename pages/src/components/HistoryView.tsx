import React, { useEffect, useState } from 'react';
import { getHistory } from '../utils/api';

interface SystemInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

interface HistoryEntry extends SystemInfo {
  url: string;
  title: string;
  visitTime: number;
  visitCount: number;
  clientId: string;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

interface HistoryResponse {
  history: HistoryEntry[];
  pagination: PaginationInfo;
}

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 100,
    offset: 0,
    totalEntries: 0,
    totalPages: 1,
    currentPage: 1
  });
  const [filters, setFilters] = useState({
    clientId: '',
    startDate: '',
    endDate: ''
  });

  const fetchHistory = async (params = {}) => {
    setLoading(true);
    try {
      const data: HistoryResponse = await getHistory({
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters,
        ...params
      });
      setHistory(data.history);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []); // Run only on mount

  useEffect(() => {
    if (pagination.offset > 0) {
      fetchHistory();
    }
  }, [pagination.offset]); // Run when offset changes

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * pagination.limit;
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchHistory({ offset: 0 });
  };

  if (loading && !history.length) {
    return <div className="history-view">Loading history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="history-view">
      <h2>Browsing History</h2>
      
      <form onSubmit={handleFilterSubmit} className="history-filters">
        <div className="filter-group">
          <label>
            Client ID:
            <input
              type="text"
              name="clientId"
              value={filters.clientId}
              onChange={handleFilterChange}
              placeholder="Filter by client ID"
            />
          </label>
        </div>
        <div className="filter-group">
          <label>
            Start Date:
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </label>
        </div>
        <div className="filter-group">
          <label>
            End Date:
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </label>
        </div>
        <button type="submit">Apply Filters</button>
        <button type="button" onClick={() => {
          setFilters({ clientId: '', startDate: '', endDate: '' });
          setPagination(prev => ({ ...prev, offset: 0 }));
          fetchHistory({ offset: 0, clientId: '', startDate: '', endDate: '' });
        }}>Clear Filters</button>
      </form>

      <div className="history-list">
        {history.map((entry, index) => {
          const date = new Date(entry.visitTime);
          return (
            <div key={index} className="history-item">
              <div className="history-item-time">
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </div>
              <div className="history-item-content">
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.title || entry.url}
                </a>
                <div className="history-item-details">
                  <span className="client-id">Client: {entry.clientId}</span>
                  <span className="visit-count">Visits: {entry.visitCount}</span>
                  <span className="device-info">
                    {entry.browserName} {entry.browserVersion} on {entry.platform}
                  </span>
                  <span className="device-id">Device: {entry.deviceId}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};