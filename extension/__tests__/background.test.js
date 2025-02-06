import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getClientId, uploadHistory } from '../background';

describe('Background Script', () => {
  let mockChrome;
  let mockFetch;

  beforeEach(() => {
    mockChrome = {
      storage: {
        local: {
          get: vi.fn(),
        },
      },
      history: {
        search: vi.fn(),
      },
      tabs: {
        onUpdated: {
          addListener: vi.fn(),
        },
      },
      alarms: {
        create: vi.fn(),
        onAlarm: {
          addListener: vi.fn(),
        },
      },
    };

    mockFetch = vi.fn();
    global.chrome = mockChrome;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('getClientId returns stored client ID', async () => {
    const clientId = 'test-client-id';
    mockChrome.storage.local.get.mockImplementation((key, callback) => {
      callback({ clientId });
    });

    const result = await getClientId();
    expect(result).toBe(clientId);
    expect(mockChrome.storage.local.get).toHaveBeenCalledWith('clientId', expect.any(Function));
  });

  it('uploadHistory syncs history items', async () => {
    const clientId = 'test-client-id';
    const historyItems = [
      {
        url: 'https://example.com',
        title: 'Example',
        visitCount: 1,
        lastVisitTime: Date.now(),
      },
    ];

    mockChrome.storage.local.get.mockImplementation((key, callback) => {
      callback({ clientId });
    });

    mockChrome.history.search.mockResolvedValue(historyItems);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await uploadHistory();

    expect(mockChrome.history.search).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/sync'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Client-ID': clientId,
        }),
        body: expect.stringContaining(historyItems[0].url),
      })
    );
  });

  it('uploadHistory handles missing client ID', async () => {
    mockChrome.storage.local.get.mockImplementation((key, callback) => {
      callback({});
    });

    await uploadHistory();

    expect(mockChrome.history.search).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uploadHistory handles API error', async () => {
    const clientId = 'test-client-id';
    const historyItems = [
      {
        url: 'https://example.com',
        title: 'Example',
        visitCount: 1,
        lastVisitTime: Date.now(),
      },
    ];

    mockChrome.storage.local.get.mockImplementation((key, callback) => {
      callback({ clientId });
    });

    mockChrome.history.search.mockResolvedValue(historyItems);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(uploadHistory()).rejects.toThrow('HTTP error! status: 500');
  });
});