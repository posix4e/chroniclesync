import worker from './index.js';

describe('Worker API', () => {
  let env;

  beforeEach(() => {
    env = {
      DB: {
        prepare: jest.fn().mockImplementation((query) => ({
          bind: jest.fn().mockReturnThis(),
          run: jest.fn().mockResolvedValue({}),
          all: jest.fn().mockImplementation(() => {
            if (query.includes('sqlite_master')) {
              return Promise.resolve({ results: [{ name: 'clients' }] });
            }
            return Promise.resolve({ results: [] });
          }),
        })),
      },
      STORAGE: {
        get: jest.fn().mockResolvedValue(null),
        put: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({ objects: [] }),
        head: jest.fn().mockResolvedValue({}),
      },
    };
  });

  it('requires client ID', async () => {
    const req = new Request('https://api.chroniclesync.xyz/');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Client ID required');
  });

  it('handles non-existent client data', async () => {
    const req = new Request('https://api.chroniclesync.xyz/?clientId=test123');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('No data found');
  });

  it('stores and retrieves client data', async () => {
    const testData = { key: 'value' };
    
    // Mock storage.get to return data after it's stored
    env.STORAGE.get.mockImplementation((key) => {
      if (key === 'test123/data') {
        return {
          body: JSON.stringify(testData),
          uploaded: new Date(),
        };
      }
      return null;
    });
    
    // Store data
    const postReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    const postRes = await worker.fetch(postReq, env);
    expect(postRes.status).toBe(200);

    // Retrieve data
    const getReq = new Request('https://api.chroniclesync.xyz/?clientId=test123');
    const getRes = await worker.fetch(getReq, env);
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data).toEqual(testData);
  });

  it('requires authentication for admin access', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(401);
  });

  it('allows admin access with correct password', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin/clients', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('handles unsupported methods', async () => {
    const req = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'PUT',
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(405);
    expect(await res.text()).toBe('Method not allowed');
  });

  it('handles admin client operations with errors', async () => {
    // Mock Storage.list to throw error
    env.STORAGE.list = jest.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });

    const deleteReq = new Request('https://api.chroniclesync.xyz/admin/client?clientId=test123', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const deleteRes = await worker.fetch(deleteReq, env);
    expect(deleteRes.status).toBe(500);
  });

  it('handles admin client operations', async () => {
    // Test client deletion
    const deleteReq = new Request('https://api.chroniclesync.xyz/admin/client?clientId=test123', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const deleteRes = await worker.fetch(deleteReq, env);
    expect(deleteRes.status).toBe(200);
    expect(await deleteRes.text()).toBe('Client deleted');

    // Test invalid method
    const putReq = new Request('https://api.chroniclesync.xyz/admin/client?clientId=test123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const putRes = await worker.fetch(putReq, env);
    expect(putRes.status).toBe(405);

    // Test missing client ID
    const noClientReq = new Request('https://api.chroniclesync.xyz/admin/client', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const noClientRes = await worker.fetch(noClientReq, env);
    expect(noClientRes.status).toBe(400);
  });

  it('handles admin status check with errors', async () => {
    // Mock DB and Storage to throw errors
    env.DB.prepare = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });
    env.STORAGE.head = jest.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });

    const req = new Request('https://api.chroniclesync.xyz/admin/status', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.production.database).toBe(false);
    expect(data.production.storage).toBe(false);
  });

  it('handles admin status check', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin/status', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('production');
    expect(data).toHaveProperty('staging');
    expect(data.production).toHaveProperty('worker', true);
    expect(data.production).toHaveProperty('database', true);
    expect(data.production).toHaveProperty('storage', true);
  });

  it('handles CORS headers correctly', async () => {
    // Test production domain
    const prodReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { 'Origin': 'https://chroniclesync.xyz' },
    });
    const prodRes = await worker.fetch(prodReq, env);
    expect(prodRes.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');

    // Test pages.dev subdomain
    const pagesReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { 'Origin': 'https://my-branch.chroniclesync-pages.pages.dev' },
    });
    const pagesRes = await worker.fetch(pagesReq, env);
    expect(pagesRes.headers.get('Access-Control-Allow-Origin')).toBe('https://my-branch.chroniclesync-pages.pages.dev');

    // Test localhost
    const localReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { 'Origin': 'http://localhost:8787' },
    });
    const localRes = await worker.fetch(localReq, env);
    expect(localRes.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8787');

    // Test disallowed origin
    const badReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { 'Origin': 'https://evil.com' },
    });
    const badRes = await worker.fetch(badReq, env);
    expect(badRes.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');

    // Test OPTIONS request
    const optionsReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://chroniclesync.xyz' },
    });
    const optionsRes = await worker.fetch(optionsReq, env);
    expect(optionsRes.status).toBe(200);
    expect(optionsRes.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });

  it('handles client post errors', async () => {
    // Test JSON parse error
    const badJsonReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'POST',
      body: 'invalid json',
    });
    const badJsonRes = await worker.fetch(badJsonReq, env);
    expect(badJsonRes.status).toBe(500);
    const badJsonData = await badJsonRes.json();
    expect(badJsonData.error).toBeTruthy();

    // Test storage error
    env.STORAGE.put.mockImplementation(() => {
      throw new Error('Storage error');
    });
    const storageErrorReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });
    const storageErrorRes = await worker.fetch(storageErrorReq, env);
    expect(storageErrorRes.status).toBe(500);
    const storageErrorData = await storageErrorRes.json();
    expect(storageErrorData.error).toBe('Storage error');
  });

  it('handles admin workflow triggers', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
      body: JSON.stringify({
        action: 'create-resources',
        environment: 'production',
      }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('status', 'pending');

    // Test invalid method
    const getReq = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const getRes = await worker.fetch(getReq, env);
    expect(getRes.status).toBe(405);

    // Test invalid action
    const invalidActionReq = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
      body: JSON.stringify({
        action: 'invalid-action',
        environment: 'production',
      }),
    });
    const invalidActionRes = await worker.fetch(invalidActionReq, env);
    expect(invalidActionRes.status).toBe(400);

    // Test invalid environment
    const invalidEnvReq = new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
      body: JSON.stringify({
        action: 'create-resources',
        environment: 'invalid',
      }),
    });
    const invalidEnvRes = await worker.fetch(invalidEnvReq, env);
    expect(invalidEnvRes.status).toBe(400);
  });
});