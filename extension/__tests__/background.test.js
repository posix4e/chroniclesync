import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockChrome, mockFetch } from './setup';

// Set up global mocks
global.chrome = mockChrome;
global.fetch = mockFetch;

// Import the module after setting up mocks
import { getConfig, syncHistory } from '../background.js';

describe('Background Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config when storage is empty', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});
      const config = await getConfig();
      expect(config).toEqual({
        apiEndpoint: 'https://api.chroniclesync.xyz',
        clientId: 'extension-default'
      });
    });

    it('should return stored config when available', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        apiEndpoint: 'https://custom-api.example.com',
        clientId: 'custom-client'
      });
      const config = await getConfig();
      expect(config).toEqual({
        apiEndpoint: 'https://custom-api.example.com',
        clientId: 'custom-client'
      });
    });
  });

  describe('syncHistory', () => {
    it('should send history data to API', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});
      mockFetch.mockResolvedValue({ ok: true });
      const url = 'https://example.com';
      const title = 'Example Page';
      const timestamp = '2024-02-07T12:00:00Z';

      await syncHistory(url, title, timestamp);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.chroniclesync.xyz/history',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'extension-default'
          },
          body: JSON.stringify({ url, title, timestamp })
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});
      const consoleError = vi.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await syncHistory('https://example.com', 'Example', '2024-02-07T12:00:00Z');

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});