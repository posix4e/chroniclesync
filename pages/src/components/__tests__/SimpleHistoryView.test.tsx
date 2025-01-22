import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SimpleHistoryView } from '../SimpleHistoryView';
import { DB } from '../../utils/db';

jest.mock('../../utils/db');

describe('SimpleHistoryView', () => {
  let db: jest.Mocked<DB>;

  beforeEach(() => {
    db = {
      clientId: 'test-client',
      getHistory: jest.fn().mockResolvedValue([
        {
          timestamp: Date.now(),
          action: 'navigation',
          data: { url: 'https://example.com', title: 'Example' },
          synced: true
        }
      ])
    } as unknown as jest.Mocked<DB>;
  });

  it('should render history entries', async () => {
    render(<SimpleHistoryView db={db} />);

    // Wait for entries to load
    await screen.findByTestId('history-container');

    // Check if history entry is rendered
    const entry = await screen.findByTestId('history-entry');
    expect(entry).toBeInTheDocument();
    expect(entry.className).toContain('synced');

    // Check entry content
    const url = screen.getByTestId('history-url');
    expect(url.textContent).toBe('https://example.com');
  });

  it('should show offline status', async () => {
    const mockOnline = jest.spyOn(navigator, 'onLine', 'get');
    mockOnline.mockReturnValue(false);

    render(<SimpleHistoryView db={db} />);

    await screen.findByTestId('history-container');
    expect(screen.getByText('Status: Offline')).toBeInTheDocument();

    mockOnline.mockRestore();
  });
});