import { syncHistory, type HistoryEntry } from '../src/api';
import { getConfig } from '../config';

jest.mock('../config', () => ({
  getConfig: jest.fn()
}));

describe('History Sync', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    (getConfig as jest.Mock).mockResolvedValue({
      apiEndpoint: 'https://api.test',
      clientId: 'test-client'
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      'https://api.test/api/history',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'test-client'
        },
        body: JSON.stringify({ entries })
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