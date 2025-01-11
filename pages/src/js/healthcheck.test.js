/**
 * @jest-environment jsdom
 */

import { HealthCheck } from './healthcheck';

describe('HealthCheck', () => {
  let healthCheck;
  const mockApiUrl = 'http://localhost:8787';
  const mockClientId = 'test123';

  beforeEach(() => {
    healthCheck = new HealthCheck(mockApiUrl, mockClientId);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('initializes with provided values', () => {
      expect(healthCheck.apiUrl).toBe(mockApiUrl);
      expect(healthCheck.clientId).toBe(mockClientId);
      expect(healthCheck.lastCheckTime).toBeNull();
      expect(healthCheck.currentStatus).toBeNull();
    });

    it('initializes with default clientId', () => {
      const hc = new HealthCheck(mockApiUrl);
      expect(hc.apiUrl).toBe(mockApiUrl);
      expect(hc.clientId).toBeNull();
    });
  });

  describe('setClientId', () => {
    it('updates clientId', () => {
      const newClientId = 'newId123';
      healthCheck.setClientId(newClientId);
      expect(healthCheck.clientId).toBe(newClientId);
    });

    it('can set clientId to null', () => {
      healthCheck.setClientId(null);
      expect(healthCheck.clientId).toBeNull();
    });
  });

  describe('getLastCheckTime', () => {
    it('returns null when no check has been performed', () => {
      expect(healthCheck.getLastCheckTime()).toBeNull();
    });

    it('returns last check time after check', async () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const mockDateFn = jest.fn(() => mockDate);
      global.Date = jest.fn(mockDateFn);
      global.Date.now = mockDateFn;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ healthy: true })
      });

      await healthCheck.check();
      expect(healthCheck.getLastCheckTime()).toEqual(mockDate);
    });
  });

  describe('getCurrentStatus', () => {
    it('returns null when no check has been performed', () => {
      expect(healthCheck.getCurrentStatus()).toBeNull();
    });

    it('returns current status after check', async () => {
      const mockStatus = { healthy: true, error: null, timestamp: '2024-01-01T12:00:00Z' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      await healthCheck.check();
      expect(healthCheck.getCurrentStatus()).toEqual(mockStatus);
    });
  });

  describe('check', () => {
    beforeEach(() => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const mockDateFn = jest.fn(() => mockDate);
      global.Date = jest.fn(mockDateFn);
      global.Date.now = mockDateFn;
    });

    it('performs health check with system clientId when none provided', async () => {
      healthCheck.setClientId(null);
      const mockStatus = { healthy: true, error: null, timestamp: '2024-01-01T12:00:00Z' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      await healthCheck.check();
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/health?clientId=system`,
        expect.any(Object)
      );
    });

    it('performs health check with provided clientId', async () => {
      const mockStatus = { healthy: true, error: null, timestamp: '2024-01-01T12:00:00Z' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      await healthCheck.check();
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/health?clientId=${mockClientId}`,
        expect.any(Object)
      );
    });

    it('handles successful health check', async () => {
      const mockStatus = { healthy: true, error: null, timestamp: '2024-01-01T12:00:00Z' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const result = await healthCheck.check();
      expect(result).toEqual(mockStatus);
      expect(healthCheck.currentStatus).toEqual(mockStatus);
    });

    it('handles failed health check', async () => {
      const mockStatus = { healthy: false, error: 'Service unavailable', timestamp: '2024-01-01T12:00:00Z' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const result = await healthCheck.check();
      expect(result).toEqual(mockStatus);
      expect(healthCheck.currentStatus).toEqual(mockStatus);
    });

    it('handles network error', async () => {
      const networkError = new Error('Network error');
      global.fetch.mockRejectedValueOnce(networkError);

      await expect(healthCheck.check()).rejects.toThrow('Network error');
      expect(healthCheck.currentStatus.healthy).toBe(false);
      expect(healthCheck.currentStatus.error).toBe('Network error');
    });

    it('handles non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(healthCheck.check()).rejects.toThrow('Health check request failed');
      expect(healthCheck.currentStatus.healthy).toBe(false);
      expect(healthCheck.currentStatus.error).toBe('Health check request failed');
    });

    it('handles JSON parse error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(healthCheck.check()).rejects.toThrow('Invalid JSON');
      expect(healthCheck.currentStatus.healthy).toBe(false);
      expect(healthCheck.currentStatus.error).toBe('Invalid JSON');
    });
  });

  describe('updateUI', () => {
    let healthStatus;
    let lastCheck;

    beforeEach(() => {
      healthStatus = document.createElement('div');
      lastCheck = document.createElement('div');
    });

    it('throws error if DOM elements are missing', () => {
      expect(() => healthCheck.updateUI(null, lastCheck)).toThrow('Missing required DOM elements');
      expect(() => healthCheck.updateUI(healthStatus, null)).toThrow('Missing required DOM elements');
    });

    it('displays initial state when no check performed', () => {
      healthCheck.updateUI(healthStatus, lastCheck);
      expect(healthStatus.textContent).toBe('Not checked');
      expect(healthStatus.className).toBe('');
      expect(lastCheck.textContent).toBe('Never');
    });

    it('displays healthy status', async () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const mockDateFn = jest.fn(() => mockDate);
      global.Date = jest.fn(mockDateFn);
      global.Date.now = mockDateFn;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ healthy: true, error: null, timestamp: '2024-01-01T12:00:00Z' })
      });

      await healthCheck.check();
      const status = healthCheck.updateUI(healthStatus, lastCheck);

      expect(healthStatus.textContent).toBe('✅ Healthy');
      expect(healthStatus.className).toBe('health-ok');
      expect(lastCheck.textContent).toBe(mockDate.toLocaleString());
      expect(status.healthy).toBe(true);
    });

    it('displays unhealthy status', async () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const mockDateFn = jest.fn(() => mockDate);
      global.Date = jest.fn(mockDateFn);
      global.Date.now = mockDateFn;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ healthy: false, error: 'Service down', timestamp: '2024-01-01T12:00:00Z' })
      });

      await healthCheck.check();
      const status = healthCheck.updateUI(healthStatus, lastCheck);

      expect(healthStatus.textContent).toBe('❌ Unhealthy');
      expect(healthStatus.className).toBe('health-error');
      expect(lastCheck.textContent).toBe(mockDate.toLocaleString());
      expect(status.healthy).toBe(false);
      expect(status.error).toBe('Service down');
    });
  });
});