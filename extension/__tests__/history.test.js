import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('History Sync', () => {
  let mockChrome;
  let mockFetch;

  beforeEach(() => {
    // Mock chrome API
    mockChrome = {
      history: {
        search: vi.fn()
      },
      storage: {
        sync: {
          get: vi.fn()
        }
      },
      tabs: {
        onUpdated: {
          addListener: vi.fn()
        }
      },
      runtime: {
        sendMessage: vi.fn()
      }
    };
    global.chrome = mockChrome;

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should sync history data successfully', async () => {
    const mockHistoryItems = [
      {
        url: 'https://example.com',
        title: 'Example Site',
        visitCount: 5,
        lastVisitTime: Date.now()
      }
    ];

    const mockConfig = {
      apiEndpoint: 'https://api.chroniclesync.xyz',
      clientId: 'test-client'
    };

    // Setup mocks
    vi.mocked(mockChrome.history.search).mockResolvedValue(mockHistoryItems);
    vi.mocked(mockChrome.storage.sync.get).mockResolvedValue(mockConfig);
    vi.mocked(mockFetch).mockResolvedValue({ ok: true });

    // Import and test the syncHistory function
    const { syncHistory } = await import('../background.js');
    const result = await syncHistory(mockConfig);

    // Verify the history search was called
    expect(mockChrome.history.search).toHaveBeenCalledWith({
      text: '',
      startTime: expect.any(Number),
      maxResults: 5000
    });

    // Verify the API call was made correctly
    expect(mockFetch).toHaveBeenCalledWith(
      `${mockConfig.apiEndpoint}/api/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': mockConfig.clientId
        },
        body: JSON.stringify({
          type: 'history',
          data: mockHistoryItems
        })
      }
    );

    expect(result).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const mockHistoryItems = [
      {
        url: 'https://example.com',
        title: 'Example Site',
        visitCount: 1,
        lastVisitTime: Date.now()
      }
    ];

    const mockConfig = {
      apiEndpoint: 'https://api.chroniclesync.xyz',
      clientId: 'test-client'
    };

    // Setup mocks
    vi.mocked(mockChrome.history.search).mockResolvedValue(mockHistoryItems);
    vi.mocked(mockChrome.storage.sync.get).mockResolvedValue(mockConfig);
    vi.mocked(mockFetch).mockResolvedValue({ ok: false, status: 500 });

    // Import and test the syncHistory function
    const { syncHistory } = await import('../background.js');
    const result = await syncHistory(mockConfig);

    expect(result).toBe(false);
  });
});