import React, { useEffect, useState, useMemo } from 'react';
import { HistoryItem, HistoryFilters } from '../types/history';
import { fetchHistory } from '../utils/api';
import debounce from 'lodash/debounce';
import { createDecryptionManager, EncryptedData } from '../utils/encryption';

interface HistoryViewProps {
  clientId: string;
}

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;
const MIN_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
const MAX_DATE = new Date();

export const HistoryView: React.FC<HistoryViewProps> = ({ clientId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({
    startDate: MIN_DATE.getTime(),
    endDate: MAX_DATE.getTime(),
    searchQuery: '',
    platform: '',
    browser: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });
  const [totalPages, setTotalPages] = useState(1);
  const [uniquePlatforms, setUniquePlatforms] = useState<string[]>([]);
  const [uniqueBrowsers, setUniqueBrowsers] = useState<string[]>([]);

  const loadHistory = async (currentFilters: HistoryFilters) => {
    try {
      setLoading(true);
      const response = await fetchHistory(clientId, currentFilters);
      if (!response?.history) {
        throw new Error('Invalid history data received');
      }

      // Initialize decryption manager
      const decryptionManager = createDecryptionManager(clientId);

      // Decrypt history items
      const decryptedHistory = await Promise.all(response.history.map(async item => {
        if (item.isEncrypted) {
          try {
            const decryptedUrl = await decryptionManager.decrypt(item.url as unknown as EncryptedData);
            const decryptedTitle = item.title ? await decryptionManager.decrypt(item.title as unknown as EncryptedData) : null;
            return {
              ...item,
              url: decryptedUrl,
              title: decryptedTitle,
              isEncrypted: false
            };
          } catch (error) {
            console.error('Failed to decrypt history item:', error);
            return item;
          }
        }
        return item;
      }));

      setHistory(decryptedHistory);
      setTotalPages(response.pagination.totalPages);
      
      // Update unique filters
      const platforms = [...new Set(decryptedHistory.map(item => item.platform))];
      const browsers = [...new Set(decryptedHistory.map(item => item.browserName))];
      setUniquePlatforms(platforms);
      setUniqueBrowsers(browsers);
      
      setError(null);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  const debouncedSearch = useMemo(
    () => debounce((newFilters: HistoryFilters) => loadHistory(newFilters), 300),
    [clientId]
  );

  useEffect(() => {
    if (clientId) {
      if (filters.searchQuery) {
        debouncedSearch(filters);
      } else {
        loadHistory(filters);
      }
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [clientId, filters]);

  const handleFilterChange = (key: keyof HistoryFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'page' ? Number(value) : value,
      page: key === 'page' ? Number(value) : 1 // Reset page when changing filters
    }));
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value).getTime();
    handleFilterChange(type === 'start' ? 'startDate' : 'endDate', date);
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4" data-testid="history-view">
      <h2 className="text-2xl font-bold mb-4">Browsing History</h2>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={new Date(filters.startDate || 0).toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('start', e.target.value)}
              min={MIN_DATE.toISOString().split('T')[0]}
              max={MAX_DATE.toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={new Date(filters.endDate || 0).toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('end', e.target.value)}
              min={MIN_DATE.toISOString().split('T')[0]}
              max={MAX_DATE.toISOString().split('T')[0]}
            />
          </div>
          
          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Platform</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
            >
              <option value="">All Platforms</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
          
          {/* Browser Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Browser</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={filters.browser}
              onChange={(e) => handleFilterChange('browser', e.target.value)}
            >
              <option value="">All Browsers</option>
              {uniqueBrowsers.map(browser => (
                <option key={browser} value={browser}>{browser}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search by title or URL..."
            className="block w-full rounded-md border-gray-300 shadow-sm"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center p-4">Loading history...</div>
      )}

      {/* No Results */}
      {!loading && !history?.length && (
        <div className="text-center p-4">No history found</div>
      )}

      {/* History List */}
      {!loading && history?.length > 0 && (
        <>
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className="bg-white shadow rounded-lg p-4"
                data-testid="history-item"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      <a
                        href={typeof item.url === 'string' ? item.url : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {(typeof item.title === 'string' ? item.title : null) || (typeof item.url === 'string' ? item.url : 'Encrypted URL')}
                      </a>
                    </h3>
                    <p className="text-gray-500 text-sm">{typeof item.url === 'string' ? item.url : 'Encrypted URL'}</p>
                    <div className="text-gray-400 text-xs mt-1">
                      Visited {new Date(item.visitTime).toLocaleString()} • 
                      {item.visitCount} {item.visitCount === 1 ? 'visit' : 'visits'}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{item.browserName} {item.browserVersion}</div>
                    <div>{item.platform}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination and Page Size */}
          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                className="rounded-md border-gray-300 shadow-sm"
                value={filters.pageSize}
                onChange={(e) => handleFilterChange('pageSize', Number(e.target.value))}
                data-testid="page-size-select"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              <button
                className="px-4 py-2 border rounded-md disabled:opacity-50"
                onClick={() => handleFilterChange('page', filters.page! - 1)}
                disabled={filters.page === 1}
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {filters.page} of {totalPages}
              </span>
              <button
                className="px-4 py-2 border rounded-md disabled:opacity-50"
                onClick={() => handleFilterChange('page', filters.page! + 1)}
                disabled={filters.page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};