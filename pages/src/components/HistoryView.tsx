import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types/history';
import { fetchHistory } from '../utils/api';

interface HistoryViewProps {
  clientId: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ clientId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await fetchHistory(clientId);
        if (!response?.history) {
          console.error('Invalid history response:', response);
          throw new Error('Invalid history data received');
        }
        setHistory(response.history);
        setError(null);
      } catch (err) {
        console.error('Error loading history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadHistory();
    }
  }, [clientId]);

  if (loading) {
    return <div className="text-center p-4">Loading history...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!history?.length) {
    return <div className="text-center p-4">No history found</div>;
  }

  return (
    <div className="container mx-auto p-4" data-testid="history-view">
      <h2 className="text-2xl font-bold mb-4">Browsing History</h2>
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
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {item.title || item.url}
                  </a>
                </h3>
                <p className="text-gray-500 text-sm">{item.url}</p>
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
    </div>
  );
};