import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncHistory, type HistoryEntry } from '../src/api';
import { getConfig } from '../config';

vi.mock('../config', () => ({
  getConfig: vi.fn()
}));

describe('History Sync', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
      apiUrl: 'https://api.test',
      clientId: 'test-client'
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully sync history entries', async () => {
    const entries: HistoryEntry[] = [
      {
        url: 'https://example.com',
        title: 'Example',
        visitTime: Date.now()
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    const result = await syncHistory(entries);
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/api/history?clientId=test-client',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entries)
      }
    );
  });

  it('should handle API errors', async () => {
    const entries: HistoryEntry[] = [
      {
        url: 'https://example.com',
        title: 'Example',
        visitTime: Date.now()
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const result = await syncHistory(entries);
    expect(result).toBe(false);
  });

  it('should handle network errors', async () => {
    const entries: HistoryEntry[] = [
      {
        url: 'https://example.com',
        title: 'Example',
        visitTime: Date.now()
      }
    ];

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await syncHistory(entries);
    expect(result).toBe(false);
  });
});