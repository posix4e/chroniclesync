/**
 * @jest-environment jsdom
 */

import {
  initializeClient,
  saveData,
  syncData,
  loginAdmin,
  refreshStats,
  deleteClient,
  viewClientData,
  triggerWorkflow,
  checkSystemStatus,
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
  <div id="prodWorkerStatus"></div>
  <div id="prodDbStatus"></div>
  <div id="prodStorageStatus"></div>
  <div id="stagingWorkerStatus"></div>
  <div id="stagingDbStatus"></div>
  <div id="stagingStorageStatus"></div>
`;

// Mock fetch
global.fetch = jest.fn();

// Mock alert
global.alert = jest.fn();

// Mock confirm
global.confirm = jest.fn();

describe('Main', () => {
  let mockDB;

  beforeEach(() => {
    // Reset mocks
    fetch.mockReset();
    alert.mockReset();
    confirm.mockReset();

    // Get the mock DB instance
    const { DB } = require('./db');
    mockDB = DB.mock.results[0].value;
    mockDB.init.mockReset();
    mockDB.getData.mockReset();
    mockDB.setData.mockReset();
    mockDB.clientId = null;
    
    // Reset DOM elements
    document.getElementById('clientId').value = '';
    document.getElementById('dataInput').value = '';
    document.getElementById('dataSection').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('adminLogin').classList.remove('hidden');
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

      mockDB.init.mockImplementation((clientId) => {
        mockDB.clientId = clientId;
        return Promise.resolve();
      });

      await initializeClient();

      expect(mockDB.init).toHaveBeenCalledWith('test123');
      expect(document.getElementById('dataInput').value).toBe(JSON.stringify(mockData, null, 2));
      expect(document.getElementById('dataSection').classList.contains('hidden')).toBe(false);
    });

    it('handles init error', async () => {
      document.getElementById('clientId').value = 'test123';
      mockDB.init.mockRejectedValue(new Error('DB error'));

      await initializeClient();

      expect(alert).toHaveBeenCalledWith('Error initializing client: DB error');
    });

    it('handles getData error', async () => {
      document.getElementById('clientId').value = 'test123';
      mockDB.init.mockResolvedValue();
      mockDB.getData.mockRejectedValue(new Error('DB error'));

      await initializeClient();

      expect(alert).toHaveBeenCalledWith('Error loading data: DB error');
    });
  });

  describe('saveData', () => {
    it('saves valid JSON data', async () => {
      const mockData = { key: 'value' };
      document.getElementById('dataInput').value = JSON.stringify(mockData);

      await saveData();

      expect(mockDB.setData).toHaveBeenCalledWith(mockData);
      expect(alert).toHaveBeenCalledWith('Data saved locally');
    });

    it('handles invalid JSON data', async () => {
      document.getElementById('dataInput').value = 'invalid json';

      await saveData();

      expect(alert).toHaveBeenCalledWith('Invalid JSON data');
    });

    it('handles setData error', async () => {
      const mockData = { key: 'value' };
      document.getElementById('dataInput').value = JSON.stringify(mockData);
      mockDB.setData.mockRejectedValue(new Error('DB error'));

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

      await syncData();

      expect(fetch).toHaveBeenCalledWith(
        'https://chroniclesync-worker.posix4e.workers.dev?clientId=test123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      );
      expect(alert).toHaveBeenCalledWith('Sync successful');
    });

    it('handles sync failure', async () => {
      mockDB.getData.mockResolvedValue({});
      mockDB.clientId = 'test123';
      fetch.mockResolvedValue({ ok: false });

      await syncData();

      expect(alert).toHaveBeenCalledWith('Sync error: Sync failed');
    });

    it('handles network error', async () => {
      mockDB.getData.mockResolvedValue({});
      mockDB.clientId = 'test123';
      fetch.mockRejectedValue(new Error('Network error'));

      await syncData();

      expect(alert).toHaveBeenCalledWith('Sync error: Network error');
    });

    it('handles getData error', async () => {
      mockDB.getData.mockRejectedValue(new Error('DB error'));
      mockDB.clientId = 'test123';

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
        'https://chroniclesync-worker.posix4e.workers.dev/admin/client?clientId=test123',
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

  describe('triggerWorkflow', () => {
    it('triggers workflow after confirmation', async () => {
      confirm.mockReturnValue(true);
      const mockResponse = { message: 'Workflow started' };
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });

      await triggerWorkflow('create-resources', 'production');

      expect(fetch).toHaveBeenCalledWith(
        'https://chroniclesync-worker.posix4e.workers.dev/admin/workflow',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer francesisthebest',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create-resources',
            environment: 'production',
          }),
        })
      );
      expect(alert).toHaveBeenCalledWith('Workflow triggered: Workflow started');
    });

    it('cancels workflow when not confirmed', async () => {
      confirm.mockReturnValue(false);

      await triggerWorkflow('create-resources', 'production');

      expect(fetch).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      confirm.mockReturnValue(true);
      fetch.mockRejectedValue(new Error('Network error'));

      await triggerWorkflow('create-resources', 'production');

      expect(alert).toHaveBeenCalledWith('Error triggering workflow: Network error');
    });

    it('handles JSON parse error', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await triggerWorkflow('create-resources', 'production');

      expect(alert).toHaveBeenCalledWith('Error triggering workflow: Invalid JSON');
    });

    it('handles trigger failure', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await triggerWorkflow('create-resources', 'production');

      expect(alert).toHaveBeenCalledWith('Error triggering workflow: Failed to trigger workflow');
    });
  });

  describe('checkSystemStatus', () => {
    it('updates status indicators', async () => {
      const mockStatus = {
        production: {
          worker: true,
          database: true,
          storage: false,
        },
        staging: {
          worker: true,
          database: false,
          storage: true,
        },
      };
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockStatus) });

      await checkSystemStatus();

      expect(document.getElementById('prodWorkerStatus').textContent).toBe('✅ Online');
      expect(document.getElementById('prodDbStatus').textContent).toBe('✅ Connected');
      expect(document.getElementById('prodStorageStatus').textContent).toBe('❌ Error');
      expect(document.getElementById('stagingWorkerStatus').textContent).toBe('✅ Online');
      expect(document.getElementById('stagingDbStatus').textContent).toBe('❌ Error');
      expect(document.getElementById('stagingStorageStatus').textContent).toBe('✅ Available');
    });

    it('handles status check failure', async () => {
      fetch.mockResolvedValue({ ok: false });

      await checkSystemStatus();

      expect(alert).toHaveBeenCalledWith('Error checking status: Failed to check status');
    });

    it('handles network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await checkSystemStatus();

      expect(alert).toHaveBeenCalledWith('Error checking status: Network error');
    });

    it('handles JSON parse error', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await checkSystemStatus();

      expect(alert).toHaveBeenCalledWith('Error checking status: Invalid JSON');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1500)).toBe('1.46 KB');
    });
  });
});