import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getHistory, syncHistory, getClientId, setClientId } from '../src/historySync';

describe('History Sync', () => {
  beforeEach(() => {
    global.chrome = {
      history: {
        search: vi.fn(),
      },
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('getHistory returns browser history', async () => {
    const mockHistory = [
      { url: 'https://example.com', title: 'Example', visitCount: 1, lastVisitTime: 123456789 },
    ];
    chrome.history.search.mockImplementation((query, callback) => callback(mockHistory));

    const result = await getHistory();
    expect(result).toEqual(mockHistory);
    expect(chrome.history.search).toHaveBeenCalled();
  });

  test('syncHistory sends history to API', async () => {
    const mockHistory = [
      { url: 'https://example.com', title: 'Example', visitCount: 1, lastVisitTime: 123456789 },
    ];
    const clientId = 'test-client-id';
    chrome.history.search.mockImplementation((query, callback) => callback(mockHistory));
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await syncHistory(clientId);
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/history'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Client-ID': clientId,
        }),
      })
    );
  });

  test('getClientId returns stored client ID', async () => {
    const mockClientId = 'test-client-id';
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({ clientId: mockClientId }));

    const result = await getClientId();
    expect(result).toBe(mockClientId);
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['clientId'], expect.any(Function));
  });

  test('setClientId stores client ID', async () => {
    const clientId = 'test-client-id';
    chrome.storage.local.set.mockImplementation((data, callback) => callback());

    await setClientId(clientId);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ clientId }, expect.any(Function));
  });
});