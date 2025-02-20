import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryViewer, HistoryItem } from '../src/history/HistoryViewer';

const mockItems: HistoryItem[] = [
  {
    id: '1',
    url: 'https://example.com/1',
    title: 'Example 1',
    timestamp: Date.now(),
    syncStatus: 'synced',
  },
  {
    id: '2',
    url: 'https://example.com/2',
    title: 'Example 2',
    timestamp: Date.now() - 1000,
    syncStatus: 'pending',
  },
  {
    id: '3',
    url: 'https://example.com/3',
    title: 'Example 3',
    timestamp: Date.now() - 2000,
    syncStatus: 'error',
  },
];

describe('HistoryViewer', () => {
  it('renders history items', () => {
    render(<HistoryViewer items={mockItems} />);
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
    expect(screen.getByText('Example 3')).toBeInTheDocument();
  });

  it('filters items by search term', () => {
    render(<HistoryViewer items={mockItems} />);
    const searchInput = screen.getByPlaceholderText('Search history...');
    fireEvent.change(searchInput, { target: { value: 'Example 1' } });
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.queryByText('Example 2')).not.toBeInTheDocument();
  });

  it('changes sort order', () => {
    render(<HistoryViewer items={mockItems} />);
    const sortButton = screen.getByText('Sort ↓');
    fireEvent.click(sortButton);
    expect(screen.getByText('Sort ↑')).toBeInTheDocument();
  });

  it('shows sync button when onSync prop is provided', () => {
    const onSync = jest.fn();
    render(<HistoryViewer items={mockItems} onSync={onSync} />);
    const syncButton = screen.getByText('Sync Now');
    fireEvent.click(syncButton);
    expect(onSync).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<HistoryViewer items={mockItems} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to load history';
    render(<HistoryViewer items={mockItems} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});