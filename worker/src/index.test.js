import worker from './index.js';

describe('Worker API', () => {
  let env;

  beforeEach(() => {
    env = {
      DB: {
        prepare: jest.fn().mockImplementation((query) => ({
          bind: jest.fn().mockReturnThis(),
          run: jest.fn().mockResolvedValue({}),
          first: jest.fn().mockImplementation(() => {
            if (query.includes('SELECT 1')) {
              return Promise.resolve({ test: 1 });
            }
            if (query.includes('sqlite_master')) {
              return Promise.resolve({ name: 'clients' });
            }
            if (query.includes('client_id')) {
              return Promise.resolve({ client_id: '_test_status_check_123' });
            }
            return Promise.resolve({});
          }),
          all: jest.fn().mockImplementation(() => {
            if (query.includes('sqlite_master')) {
              return Promise.resolve({ 
                results: [
                  { name: 'clients', sql: 'CREATE TABLE clients...' },
                  { name: 'idx_last_sync', sql: 'CREATE INDEX idx_last_sync...' }
                ] 
              });
            }
            if (query.includes('integrity_check')) {
              return Promise.resolve({ results: [{ integrity_check: 'ok' }] });
            }
            return Promise.resolve({ results: [] });
          }),
        })),
        batch: jest.fn().mockResolvedValue([]),
      },
      STORAGE: {
        get: jest.fn().mockImplementation((key) => {
          if (key === '_test_status_check_123/data') {
            return Promise.resolve({
              text: () => Promise.resolve(JSON.stringify({ test: 'data' })),
              uploaded: new Date(),
            });
          }
          if (key === '_test_status_check_123') {
            return Promise.resolve({
              text: () => Promise.resolve(JSON.stringify({ test: 'data' })),
            });
          }
          return Promise.resolve(null);
        }),
        put: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({ objects: [] }),
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
    env.STORAGE.list = jest.fn().mockImplementation(() => {
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
    expect(data.worker.status).toBe(true);
    expect(data.database.status).toBe(false);
    expect(data.storage.status).toBe(false);
    expect(data.database.error).toBe('DB error');
    expect(data.storage.error).toBe('Storage error');
  });

  it('handles admin status check', async () => {
    // Set up successful mocks
    env.DB.prepare = jest.fn().mockImplementation((query) => ({
      bind: jest.fn().mockReturnThis(),
      run: jest.fn().mockResolvedValue({}),
      first: jest.fn().mockImplementation(() => {
        if (query.includes('SELECT 1')) {
          return Promise.resolve({ test: 1 });
        }
        if (query.includes('sqlite_master')) {
          return Promise.resolve({ name: 'clients' });
        }
        if (query.includes('client_id')) {
          return Promise.resolve({ client_id: '_test_status_check_123' });
        }
        return Promise.resolve({});
      }),
      all: jest.fn().mockImplementation(() => {
        if (query.includes('sqlite_master')) {
          return Promise.resolve({ 
            results: [
              { name: 'clients', sql: 'CREATE TABLE clients...' },
              { name: 'idx_last_sync', sql: 'CREATE INDEX idx_last_sync...' }
            ] 
          });
        }
        if (query.includes('integrity_check')) {
          return Promise.resolve({ results: [{ integrity_check: 'ok' }] });
        }
        return Promise.resolve({ results: [] });
      }),
    }));

    env.STORAGE = {
      get: jest.fn().mockImplementation((key) => {
        if (key === '_test_status_check_123/data') {
          return Promise.resolve({
            text: () => Promise.resolve(JSON.stringify({ test: 'data' })),
            uploaded: new Date(),
          });
        }
        if (key === '_test_status_check_123') {
          return Promise.resolve({
            text: () => Promise.resolve(JSON.stringify({ test: 'data' })),
          });
        }
        return Promise.resolve(null);
      }),
      put: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      list: jest.fn().mockResolvedValue({ objects: [] }),
    };

    const req = new Request('https://api.chroniclesync.xyz/admin/status', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.worker.status).toBe(true);
    expect(data.database.status).toBe(true);
    expect(data.storage.status).toBe(true);
    expect(data.database.tests.connection).toBe(true);
    expect(data.database.tests.table_exists).toBe(true);
    expect(data.database.tests.write_test).toBe(true);
    expect(data.database.tests.read_test).toBe(true);
    expect(data.storage.tests.connection).toBe(true);
    expect(data.storage.tests.write_test).toBe(true);
    expect(data.storage.tests.read_test).toBe(true);
    expect(data.storage.tests.delete_test).toBe(true);
  });

  it('handles CORS headers correctly', async () => {
    // Test production domain
    const prodReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { Origin: 'https://chroniclesync.xyz' },
    });
    const prodRes = await worker.fetch(prodReq, env);
    expect(prodRes.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');

    // Test pages.dev subdomain
    const pagesReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { Origin: 'https://my-branch.chroniclesync-pages.pages.dev' },
    });
    const pagesRes = await worker.fetch(pagesReq, env);
    expect(pagesRes.headers.get('Access-Control-Allow-Origin')).toBe('https://my-branch.chroniclesync-pages.pages.dev');

    // Test localhost
    const localReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { Origin: 'http://localhost:8787' },
    });
    const localRes = await worker.fetch(localReq, env);
    expect(localRes.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8787');

    // Test disallowed origin
    const badReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      headers: { Origin: 'https://evil.com' },
    });
    const badRes = await worker.fetch(badReq, env);
    expect(badRes.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');

    // Test OPTIONS request
    const optionsReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'OPTIONS',
      headers: { Origin: 'https://chroniclesync.xyz' },
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

  describe('admin workflow', () => {
    const makeRequest = (action) => new Request('https://api.chroniclesync.xyz/admin/workflow', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer francesisthebest',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    beforeEach(() => {
      // Reset DB mock for database tests
      env.DB = {
        prepare: jest.fn().mockImplementation((query) => ({
          bind: jest.fn().mockReturnThis(),
          run: jest.fn().mockResolvedValue({}),
          first: jest.fn().mockImplementation(() => {
            if (query.includes('SELECT 1')) {
              return Promise.resolve({ test: 1 });
            }
            if (query.includes('sqlite_master')) {
              return Promise.resolve({ name: 'clients' });
            }
            return Promise.resolve({ client_id: '_test_status_check_123' });
          }),
          all: jest.fn().mockImplementation(() => {
            if (query.includes('sqlite_master')) {
              return Promise.resolve({ 
                results: [
                  { name: 'clients', sql: 'CREATE TABLE clients...' },
                  { name: 'idx_last_sync', sql: 'CREATE INDEX idx_last_sync...' }
                ] 
              });
            }
            if (query.includes('integrity_check')) {
              return Promise.resolve({ results: [{ integrity_check: 'ok' }] });
            }
            return Promise.resolve({ results: [] });
          }),
        })),
        batch: jest.fn().mockResolvedValue([]),
      };

      // Reset Storage mock for storage tests
      env.STORAGE = {
        get: jest.fn().mockImplementation((key) => {
          if (key === '_test_status_check_123') {
            return Promise.resolve({
              text: () => Promise.resolve(JSON.stringify({ test: 'data' })),
            });
          }
          return Promise.resolve(null);
        }),
        put: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({ objects: [] }),
      };
    });

    it('should initialize database', async () => {
      const request = makeRequest('init-database');
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Database initialized successfully');
      expect(data.status).toBe('completed');

      // Verify DB calls
      expect(env.DB.prepare).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS clients'));
      expect(env.DB.batch).toHaveBeenCalled();
    });

    it('should check tables', async () => {
      const request = makeRequest('check-tables');
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Database check completed');
      expect(data.status).toBe('completed');
      expect(data.tables).toBeInstanceOf(Array);
      expect(data.indexes).toBeInstanceOf(Array);
    });

    it('should repair tables', async () => {
      const request = makeRequest('repair-tables');
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Database repair completed');
      expect(data.status).toBe('completed');
      expect(data.integrityCheck).toBeInstanceOf(Array);

      // Verify DB calls
      expect(env.DB.prepare).toHaveBeenCalledWith('ANALYZE clients');
      expect(env.DB.prepare).toHaveBeenCalledWith('VACUUM');
      expect(env.DB.prepare).toHaveBeenCalledWith('PRAGMA integrity_check');
    });

    it('should reject invalid actions', async () => {
      const request = makeRequest('invalid-action');
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
    });

    it('should handle database errors', async () => {
      env.DB.prepare.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = makeRequest('init-database');
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Database operation failed');
      expect(data.details).toBe('Database error');
    });

    it('should handle invalid method', async () => {
      const request = new Request('https://api.chroniclesync.xyz/admin/workflow', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer francesisthebest',
        },
      });
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(405);
    });
  });

  describe('admin status', () => {
    it('should check all components with success', async () => {
      const request = new Request('https://api.chroniclesync.xyz/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest',
        },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.worker.status).toBe(true);
      expect(data.database.status).toBe(true);
      expect(data.storage.status).toBe(true);

      expect(data.database.tests.connection).toBe(true);
      expect(data.database.tests.table_exists).toBe(true);
      expect(data.database.tests.write_test).toBe(true);
      expect(data.database.tests.read_test).toBe(true);

      expect(data.storage.tests.connection).toBe(true);
      expect(data.storage.tests.write_test).toBe(true);
      expect(data.storage.tests.read_test).toBe(true);
      expect(data.storage.tests.delete_test).toBe(true);
    });

    it('should handle database failure', async () => {
      env.DB.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new Request('https://api.chroniclesync.xyz/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest',
        },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.worker.status).toBe(true);
      expect(data.database.status).toBe(false);
      expect(data.database.error).toBe('Database connection failed');
      expect(data.database.tests.connection).toBe(false);
    });

    it('should handle storage failure', async () => {
      env.STORAGE.list.mockImplementation(() => {
        throw new Error('Storage connection failed');
      });

      const request = new Request('https://api.chroniclesync.xyz/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest',
        },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.worker.status).toBe(true);
      expect(data.storage.status).toBe(false);
      expect(data.storage.error).toBe('Storage connection failed');
      expect(data.storage.tests.connection).toBe(false);
    });
  });
});