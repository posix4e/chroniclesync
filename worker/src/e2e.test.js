/* eslint-env jest */
import worker from './index.js';

describe('ChronicleSync E2E Tests', () => {
  let env;

  beforeEach(() => {
    // Reset storage and database state
    env = {
      DB: {
        prepare: jest.fn().mockImplementation((query) => ({
          all: jest.fn().mockResolvedValue({ results: [] }),
          run: jest.fn().mockResolvedValue(true),
          bind: jest.fn().mockReturnThis(),
        })),
      },
      STORAGE: {
        get: jest.fn().mockResolvedValue(null),
        put: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({ objects: [] }),
        head: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
      },
    };
  });

  it('should handle complete client data lifecycle', async () => {
    const clientId = 'test-client-123';
    const testData = {
      settings: { theme: 'dark' },
      bookmarks: ['page1', 'page2'],
      lastUpdate: '2024-01-10T12:00:00Z'
    };

    // 1. Initial data should not exist
    const initialGetReq = new Request(`https://api.chroniclesync.xyz/?clientId=${clientId}`);
    const initialGetRes = await worker.fetch(initialGetReq, env);
    expect(initialGetRes.status).toBe(404);
    expect(await initialGetRes.text()).toBe('No data found');

    // 2. Store client data
    const postReq = new Request(`https://api.chroniclesync.xyz/?clientId=${clientId}`, {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    const postRes = await worker.fetch(postReq, env);
    expect(postRes.status).toBe(200);
    expect(await postRes.text()).toBe('Sync successful');

    // Verify storage and database calls
    expect(env.STORAGE.put).toHaveBeenCalledWith(
      `${clientId}/data`,
      JSON.stringify(testData)
    );
    expect(env.DB.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO clients'));

    // 3. Retrieve stored data
    env.STORAGE.get.mockResolvedValueOnce({
      body: JSON.stringify(testData),
      uploaded: new Date('2024-01-10T12:00:00Z')
    });

    const getReq = new Request(`https://api.chroniclesync.xyz/?clientId=${clientId}`);
    const getRes = await worker.fetch(getReq, env);
    expect(getRes.status).toBe(200);
    expect(await getRes.json()).toEqual(testData);
    expect(getRes.headers.get('Last-Modified')).toBe('2024-01-10T12:00:00.000Z');

    // 4. Admin operations
    const authHeader = { 'Authorization': 'Bearer francesisthebest' };

    // List clients
    env.DB.prepare.mockImplementationOnce(() => ({
      all: jest.fn().mockResolvedValue({
        results: [{
          client_id: clientId,
          last_sync: '2024-01-10T12:00:00Z',
          data_size: JSON.stringify(testData).length
        }]
      })
    }));

    env.STORAGE.list.mockResolvedValueOnce({
      objects: [{
        key: `${clientId}/data`,
        size: JSON.stringify(testData).length
      }]
    });

    const listReq = new Request('https://api.chroniclesync.xyz/admin/clients', {
      headers: authHeader
    });
    const listRes = await worker.fetch(listReq, env);
    expect(listRes.status).toBe(200);
    const clients = await listRes.json();
    expect(clients).toHaveLength(1);
    expect(clients[0].clientId).toBe(clientId);
    expect(clients[0].dataSize).toBe(JSON.stringify(testData).length);

    // Delete client
    const deleteReq = new Request(`https://api.chroniclesync.xyz/admin/client?clientId=${clientId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    const deleteRes = await worker.fetch(deleteReq, env);
    expect(deleteRes.status).toBe(200);
    expect(await deleteRes.text()).toBe('Client deleted');

    // Verify client is deleted
    env.STORAGE.get.mockResolvedValueOnce(null);
    const finalGetReq = new Request(`https://api.chroniclesync.xyz/?clientId=${clientId}`);
    const finalGetRes = await worker.fetch(finalGetReq, env);
    expect(finalGetRes.status).toBe(404);
  });

  it('should handle system health and status checks', async () => {
    // Health check endpoint
    const healthReq = new Request('https://api.chroniclesync.xyz/health');
    const healthRes = await worker.fetch(healthReq, env);
    expect(healthRes.status).toBe(200);
    expect(await healthRes.json()).toEqual({ status: 'ok' });

    // System status check (admin)
    const statusReq = new Request('https://api.chroniclesync.xyz/admin/status', {
      headers: { 'Authorization': 'Bearer francesisthebest' }
    });
    const statusRes = await worker.fetch(statusReq, env);
    expect(statusRes.status).toBe(200);
    const status = await statusRes.json();
    expect(status).toHaveProperty('production');
    expect(status).toHaveProperty('staging');
    expect(status.production.worker).toBe(true);
    expect(status.production.database).toBe(true);
    expect(status.production.storage).toBe(true);
  });

  it('should handle admin workflow triggers', async () => {
    const workflowReq = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer francesisthebest' },
      body: JSON.stringify({
        action: 'create-resources',
        environment: 'production'
      })
    });
    const workflowRes = await worker.fetch(workflowReq, env);
    expect(workflowRes.status).toBe(200);
    const result = await workflowRes.json();
    expect(result).toEqual({
      message: 'Triggered create-resources workflow for production environment',
      status: 'pending'
    });

    // Invalid workflow action
    const invalidReq = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer francesisthebest' },
      body: JSON.stringify({
        action: 'invalid-action',
        environment: 'production'
      })
    });
    const invalidRes = await worker.fetch(invalidReq, env);
    expect(invalidRes.status).toBe(400);
    expect(await invalidRes.text()).toBe('Invalid action');
  });

  it('should enforce security requirements', async () => {
    const clientId = 'test-client-456';
    const testData = { key: 'value' };

    // 1. Client ID is required
    const noClientReq = new Request('https://api.chroniclesync.xyz/');
    const noClientRes = await worker.fetch(noClientReq, env);
    expect(noClientRes.status).toBe(400);
    expect(await noClientRes.text()).toBe('Client ID required');

    // 2. Admin endpoints require authentication
    const endpoints = [
      '/admin/clients',
      '/admin/status',
      `/admin/client?clientId=${clientId}`,
      '/admin/workflow'
    ];

    for (const endpoint of endpoints) {
      const req = new Request(`https://api.chroniclesync.xyz${endpoint}`);
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    }

    // 3. Invalid methods are rejected
    const methods = ['PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      const req = new Request(`https://api.chroniclesync.xyz/?clientId=${clientId}`, {
        method,
        body: JSON.stringify(testData)
      });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(405);
      expect(await res.text()).toBe('Method not allowed');
    }
  });
});