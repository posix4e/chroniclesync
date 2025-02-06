import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import HistoryService from '../src/historyService';

describe('HistoryService', () => {
  let historyService;
  const mockApiUrl = 'https://api.example.com';
  const mockClientId = 'test-client-id';

  beforeEach(() => {
    historyService = new HistoryService(mockApiUrl, mockClientId);
    global.chrome = {
      history: {
        search: vi.fn()
      }
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getHistory', () => {
    it('should fetch browser history with default parameters', async () => {
      const mockHistory = [
        { url: 'https://example.com', title: 'Example', visitCount: 1, lastVisitTime: 123456789 }
      ];
      global.chrome.history.search.mockImplementation((query, callback) => callback(mockHistory));

      const result = await historyService.getHistory();
      expect(result).toEqual(mockHistory);
      expect(global.chrome.history.search).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
          maxResults: 100
        }),
        expect.any(Function)
      );
    });
  });

  describe('syncHistory', () => {
    it('should throw error if client ID is not set', async () => {
      historyService = new HistoryService(mockApiUrl, '');
      await expect(historyService.syncHistory()).rejects.toThrow('Client ID is required');
    });

    it('should sync history successfully', async () => {
      const mockHistory = [
        { url: 'https://example.com', title: 'Example', visitCount: 1, lastVisitTime: 123456789 }
      ];
      global.chrome.history.search.mockImplementation((query, callback) => callback(mockHistory));
      global.fetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }));

      const result = await historyService.syncHistory();
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/history`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': mockClientId
          }
        })
      );
    });

    it('should handle API errors', async () => {
      global.chrome.history.search.mockImplementation((query, callback) => callback([]));
      global.fetch.mockImplementation(() => Promise.resolve({
        ok: false,
        statusText: 'Internal Server Error'
      }));

      await expect(historyService.syncHistory()).rejects.toThrow('Failed to sync history');
    });
  });
});