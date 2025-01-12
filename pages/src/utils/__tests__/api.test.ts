import { fetchWithAuth, handleResponse } from '../api';

describe('API utilities', () => {
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn();
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('fetchWithAuth', () => {
    it('should add authorization header when token is provided', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
      (window.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await fetchWithAuth('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        token: 'test-token'
      });

      expect(window.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
    });

    it('should not add authorization header when token is not provided', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
      (window.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await fetchWithAuth('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(window.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('handleResponse', () => {
    it('should return response data when ok', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      };

      const result = await handleResponse(mockResponse as Response);
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw error with status text when not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' })
      };

      await expect(handleResponse(mockResponse as Response))
        .rejects
        .toThrow('404 Not Found');
    });

    it('should include error message from response when available', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid input' })
      };

      await expect(handleResponse(mockResponse as Response))
        .rejects
        .toThrow('400 Bad Request: Invalid input');
    });
  });
});