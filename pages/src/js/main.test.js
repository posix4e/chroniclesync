/**
 * @jest-environment jsdom
 */

import {
  initializeClient,
  saveData,
  loginAdmin,
  refreshStats,
  deleteClient,
  viewClientData,
  checkHealth,
  formatBytes,
} from './main';

// Mock the DB module
jest.mock('./db', () => {
  return {
    DB: jest.fn().mockImplementation(() => ({
      init: jest.fn(),
      getData: jest.fn(),
      setData: jest.fn(),
      clientId: null,
    })),
  };
});

// Mock DOM elements
document.body.innerHTML = `
  <input id="clientId" />
  <textarea id="dataInput"></textarea>
  <div id="dataSection" class="hidden"></div>
  <input id="adminPassword" />
  <div id="adminPanel" class="hidden"></div>
  <div id="adminLogin"></div>
  <table id="statsTable"><tbody></tbody></table>
  <div id="healthStatus"></div>
  <div id="lastCheck"></div>
`;

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete window.location;
window.location = {
  hostname: 'localhost',
  origin: 'http://localhost:5173'
};

// Mock alert
global.alert = jest.fn();

// Mock confirm
global.confirm = jest.fn();

describe('Main', () => {
  let mockDB;
  let originalLocation;

  beforeEach(() => {
    // Store original location
    originalLocation = window.location;
    // Reset mocks
    fetch.mockReset();
    alert.mockReset();
    confirm.mockReset();

    // Reset DB mock
    jest.resetModules();
    mockDB = {
      init: jest.fn(),
      getData: jest.fn(),
      setData: jest.fn(),
      clientId: null
    };
    jest.mock('./db', () => ({
      DB: jest.fn().mockImplementation(() => mockDB)
    }));

    // Reset DOM elements
    document.body.innerHTML = `
      <input id="clientId" />
      <textarea id="dataInput"></textarea>
      <div id="dataSection" class="hidden"></div>
      <input id="adminPassword" />
      <div id="adminPanel" class="hidden"></div>
      <div id="adminLogin"></div>
      <table id="statsTable"><tbody></tbody></table>
      <div id="healthStatus"></div>
      <div id="lastCheck"></div>
    `;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('API_URL determination', () => {
    const testApiUrl = async (hostname, expectedUrl) => {
      // Mock window.location
      delete window.location;
      window.location = { hostname };

      // Reset modules and mocks
      jest.resetModules();
      const fetch = jest.fn();
      global.fetch = fetch;

      // Create a fresh DB mock
      const mockDB = {
        getData: jest.fn().mockResolvedValue({}),
        clientId: 'test123'
      };

      // Mock the DB module
      jest.mock('./db', () => ({
        DB: jest.fn().mockImplementation(() => mockDB)
      }));

      // Mock fetch response
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      // Import and run the module
      const { syncData } = require('./main');
      await syncData();

      // Verify the API call
      expect(fetch).toHaveBeenCalledWith(
        `${expectedUrl}?clientId=test123`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    };

    it('uses production API URL for chroniclesync.xyz', async () => {
      await testApiUrl('chroniclesync.xyz', 'https://api.chroniclesync.xyz');
    });

    it('uses staging API URL for pages.dev domain', async () => {
      await testApiUrl('branch.chroniclesync.pages.dev', 'https://api-staging.chroniclesync.xyz');
    });

    it('uses localhost API URL for local development', async () => {
      await testApiUrl('localhost', 'http://localhost:8787');
    });

    it('uses localhost API URL for 127.0.0.1', async () => {
      await testApiUrl('127.0.0.1', 'http://localhost:8787');
    });

    it('defaults to production API URL for unknown domains', async () => {
      await testApiUrl('unknown-domain.com', 'https://api.chroniclesync.xyz');
    });
  });

  describe('initializeClient', () => {
    it('requires client ID', async () => {
      await initializeClient();
      expect(alert).toHaveBeenCalledWith('Please enter a client ID');
    });

    it('initializes client and syncs data', async () => {
      document.getElementById('clientId').value = 'test123';
      const mockData = { key: 'value' };
      mockDB.getData.mockResolvedValue(mockData);
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { initializeClient } = require('./main');

      await initializeClient();

      expect(mockDB.init).toHaveBeenCalledWith('test123');
      expect(document.getElementById('dataInput').value).toBe(JSON.stringify(mockData, null, 2));
      expect(document.getElementById('dataSection').classList.contains('hidden')).toBe(false);
    });

    it('handles init error', async () => {
      document.getElementById('clientId').value = 'test123';
      mockDB.init.mockRejectedValue(new Error('DB error'));

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { initializeClient } = require('./main');

      await initializeClient();

      expect(alert).toHaveBeenCalledWith('Error initializing client: DB error');
    });

    it('handles getData error', async () => {
      document.getElementById('clientId').value = 'test123';
      mockDB.init.mockResolvedValue();
      mockDB.getData.mockRejectedValue(new Error('DB error'));

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { initializeClient } = require('./main');

      await initializeClient();

      expect(alert).toHaveBeenCalledWith('Error loading data: DB error');
    });
  });

  describe('saveData', () => {
    it('saves valid JSON data', async () => {
      const mockData = { key: 'value' };
      document.getElementById('dataInput').value = JSON.stringify(mockData);

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { saveData } = require('./main');

      await saveData();

      expect(mockDB.setData).toHaveBeenCalledWith(mockData);
      expect(alert).toHaveBeenCalledWith('Data saved locally');
    });

    it('handles invalid JSON data', async () => {
      document.getElementById('dataInput').value = 'invalid json';

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { saveData } = require('./main');

      await saveData();

      expect(alert).toHaveBeenCalledWith('Invalid JSON data');
    });

    it('handles setData error', async () => {
      const mockData = { key: 'value' };
      document.getElementById('dataInput').value = JSON.stringify(mockData);
      mockDB.setData.mockRejectedValue(new Error('DB error'));

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { saveData } = require('./main');

      await saveData();

      expect(alert).toHaveBeenCalledWith('Error saving data: DB error');
    });
  });

  describe('syncData', () => {
    it('syncs data successfully', async () => {
      const mockData = { key: 'value' };
      mockDB.getData.mockResolvedValue(mockData);
      mockDB.clientId = 'test123';
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { syncData } = require('./main');

      await syncData();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8787?clientId=test123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(alert).toHaveBeenCalledWith('Sync successful');
    });

    it('handles sync failure', async () => {
      mockDB.getData.mockResolvedValue({});
      mockDB.clientId = 'test123';
      fetch.mockResolvedValue({ ok: false });

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { syncData } = require('./main');

      await syncData();

      expect(alert).toHaveBeenCalledWith('Sync error: Sync failed');
    });

    it('handles network error', async () => {
      mockDB.getData.mockResolvedValue({});
      mockDB.clientId = 'test123';
      fetch.mockRejectedValue(new Error('Network error'));

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { syncData } = require('./main');

      await syncData();

      expect(alert).toHaveBeenCalledWith('Sync error: Network error');
    });

    it('handles getData error', async () => {
      mockDB.getData.mockRejectedValue(new Error('DB error'));
      mockDB.clientId = 'test123';

      // Reset modules to get a fresh copy of the functions
      jest.resetModules();
      const { syncData } = require('./main');

      await syncData();

      expect(alert).toHaveBeenCalledWith('Sync error: DB error');
    });
  });

  describe('loginAdmin', () => {
    it('allows access with correct password', async () => {
      document.getElementById('adminPassword').value = 'francesisthebest';
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

      await loginAdmin();

      expect(document.getElementById('adminPanel').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('adminLogin').classList.contains('hidden')).toBe(true);
    });

    it('denies access with incorrect password', async () => {
      document.getElementById('adminPassword').value = 'wrongpassword';

      await loginAdmin();

      expect(alert).toHaveBeenCalledWith('Invalid password');
    });
  });

  describe('refreshStats', () => {
    it('displays client stats', async () => {
      const mockStats = [{
        clientId: 'test123',
        lastSync: '2024-01-10T12:00:00Z',
        dataSize: 1024,
      }];
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockStats) });

      await refreshStats();

      const tbody = document.querySelector('#statsTable tbody');
      expect(tbody.innerHTML).toContain('test123');
      expect(tbody.innerHTML).toContain('1 KB');
    });

    it('handles refresh failure', async () => {
      fetch.mockResolvedValue({ ok: false });

      await refreshStats();

      expect(alert).toHaveBeenCalledWith('Error fetching stats: Failed to fetch stats');
    });

    it('handles network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await refreshStats();

      expect(alert).toHaveBeenCalledWith('Error fetching stats: Network error');
    });

    it('handles JSON parse error', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await refreshStats();

      expect(alert).toHaveBeenCalledWith('Error fetching stats: Invalid JSON');
    });
  });

  describe('deleteClient', () => {
    it('deletes client after confirmation', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await deleteClient('test123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8787/admin/client?clientId=test123',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer francesisthebest',
          },
        })
      );
      expect(alert).toHaveBeenCalledWith('Client deleted successfully');
    });

    it('cancels deletion when not confirmed', async () => {
      confirm.mockReturnValue(false);

      await deleteClient('test123');

      expect(fetch).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      confirm.mockReturnValue(true);
      fetch.mockRejectedValue(new Error('Network error'));

      await deleteClient('test123');

      expect(alert).toHaveBeenCalledWith('Error deleting client: Network error');
    });

    it('handles JSON parse error', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await deleteClient('test123');

      expect(alert).toHaveBeenCalledWith('Error deleting client: Invalid JSON');
    });

    it('handles delete failure', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await deleteClient('test123');

      expect(alert).toHaveBeenCalledWith('Error deleting client: Failed to delete client');
    });
  });

  describe('viewClientData', () => {
    it('displays client data', async () => {
      const mockData = { key: 'value' };
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });

      await viewClientData('test123');

      expect(alert).toHaveBeenCalledWith(JSON.stringify(mockData, null, 2));
    });

    it('handles view failure', async () => {
      fetch.mockResolvedValue({ ok: false });

      await viewClientData('test123');

      expect(alert).toHaveBeenCalledWith('Error fetching client data: Failed to fetch client data');
    });

    it('handles network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await viewClientData('test123');

      expect(alert).toHaveBeenCalledWith('Error fetching client data: Network error');
    });

    it('handles JSON parse error', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await viewClientData('test123');

      expect(alert).toHaveBeenCalledWith('Error fetching client data: Invalid JSON');
    });
  });

  describe('checkHealth', () => {
    beforeEach(() => {
      fetch.mockClear();
      alert.mockClear();
      document.body.innerHTML = `
        <div id="healthStatus"></div>
        <div id="lastCheck"></div>
      `;
    });

    it('updates status indicators when healthy', async () => {
      const mockStatus = {
        healthy: true,
        error: null,
        timestamp: '2025-01-11T19:44:00.000Z'
      };
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockStatus) });

      await checkHealth();

      expect(document.getElementById('healthStatus').textContent).toBe('✅ Healthy');
      expect(document.getElementById('healthStatus').className).toBe('health-ok');
      expect(document.getElementById('lastCheck').textContent).toBeTruthy();
    });

    it('updates status indicators when unhealthy', async () => {
      const mockStatus = {
        healthy: false,
        error: 'Storage connectivity issue',
        timestamp: '2025-01-11T19:44:00.000Z'
      };
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockStatus) });

      await checkHealth();

      expect(document.getElementById('healthStatus').textContent).toBe('❌ Unhealthy');
      expect(document.getElementById('healthStatus').className).toBe('health-error');
      expect(document.getElementById('lastCheck').textContent).toBeTruthy();
      expect(alert).toHaveBeenCalledWith('Health check failed: Storage connectivity issue');
    });

    it('handles network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await checkHealth();

      expect(document.getElementById('healthStatus').textContent).toBe('❌ Unhealthy');
      expect(document.getElementById('healthStatus').className).toBe('health-error');
      expect(document.getElementById('lastCheck').textContent).toBeTruthy();
      expect(alert).toHaveBeenCalledWith('Health check error: Network error');
    });

    it('handles JSON parse error', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await checkHealth();

      expect(document.getElementById('healthStatus').textContent).toBe('❌ Unhealthy');
      expect(document.getElementById('healthStatus').className).toBe('health-error');
      expect(document.getElementById('lastCheck').textContent).toBeTruthy();
      expect(alert).toHaveBeenCalledWith('Health check error: Invalid JSON');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });
  });
});