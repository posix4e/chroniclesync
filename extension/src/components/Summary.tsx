import React from 'react';
import { HistoryVisit } from '../services/SyncService';

interface SummaryProps {
  entry: HistoryVisit;
  onRegenerate?: () => void;
}

export const Summary: React.FC<SummaryProps> = ({ entry, onRegenerate }) => {
  const getStatusColor = () => {
    switch (entry.summaryStatus) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (entry.summaryStatus) {
      case 'completed':
        return 'Summary available';
      case 'pending':
        return 'Generating summary...';
      case 'error':
        return `Error: ${entry.summaryError || 'Failed to generate summary'}`;
      default:
        return 'No summary';
    }
  };

  return (
    <div className="summary-container" style={{ marginTop: '8px' }}>
      <div className="summary-header" style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <div className="summary-status" style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: '6px'
          }}></span>
          <span>{getStatusText()}</span>
        </div>
        {entry.summaryStatus !== 'pending' && (
          <button
            onClick={onRegenerate}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
            title="Regenerate summary"
          >
            ↻ Regenerate
          </button>
        )}
      </div>
      {entry.summaryStatus === 'completed' && entry.summary && (
        <div className="summary-content" style={{
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#333',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}>
          {entry.summary?.content || ''}
        </div>
      )}
      {entry.summaryStatus === 'pending' && (
        <div className="summary-loading" style={{
          padding: '8px',
          color: '#666',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <div className="loading-spinner" style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
          }}></div>
          Processing page content...
        </div>
      )}
    </div>
  );
};