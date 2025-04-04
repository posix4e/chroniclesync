import worker from './index.js';
import './test-setup.js';

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @param {string} [baseUrl]
 */
async function makeRequest(path, init, baseUrl = 'https://api.chroniclesync.xyz') {
  const url = new URL(path, baseUrl);
  return worker.fetch(new Request(url, init), getMiniflareBindings());
}

describe('Worker API', () => {
  let env;

  let originalStorageList;
  let originalStorageDelete;
  let originalMetadataGet;
  let originalMetadataList;
  let originalMetadataDelete;

  beforeEach(async () => {
    // Get fresh bindings for each test
    env = getMiniflareBindings();

    // Save original functions
    originalStorageList = env.STORAGE.list;
    originalStorageDelete = env.STORAGE.delete;
    originalMetadataGet = env.METADATA.get;
    originalMetadataList = env.METADATA.list;
    originalMetadataDelete = env.METADATA.delete;

    // Clean up KV and R2 before each test
    const { keys } = await env.METADATA.list();
    for (const key of keys) {
      await env.METADATA.delete(key.name);
    }

    const objects = await env.STORAGE.list();
    for (const obj of objects.objects) {
      await env.STORAGE.delete(obj.key);
    }
  });

  afterEach(() => {
    // Restore original functions
    if (env.STORAGE.list !== originalStorageList) {
      env.STORAGE.list = originalStorageList;
    }
    if (env.STORAGE.delete !== originalStorageDelete) {
      env.STORAGE.delete = originalStorageDelete;
    }
    if (env.METADATA.get !== originalMetadataGet) {
      env.METADATA.get = originalMetadataGet;
    }
    if (env.METADATA.list !== originalMetadataList) {
      env.METADATA.list = originalMetadataList;
    }
    if (env.METADATA.delete !== originalMetadataDelete) {
      env.METADATA.delete = originalMetadataDelete;
    }
  });

  it('requires client ID', async () => {
    const resp = await makeRequest('/');
    expect(resp.status).toBe(400);
    expect(await resp.text()).toBe('Client ID required');
  });

  it('handles non-existent client data', async () => {
    const resp = await makeRequest('/?clientId=test123');
    expect(resp.status).toBe(404);
    expect(await resp.text()).toBe('No data found');
  });

  it('handles JSON parse errors', async () => {
    const resp = await makeRequest('/?clientId=test123', {
      method: 'POST',
      body: 'invalid json'
    });
    expect(resp.status).toBe(500);
    const error = await resp.json();
    expect(error.error).toBeTruthy();
  });

  it('handles storage errors', async () => {
    const originalPut = env.STORAGE.put;
    env.STORAGE.put = () => { throw new Error('Storage error'); };

    const resp = await makeRequest('/?clientId=test123', {
      method: 'POST',
      body: JSON.stringify({ history: [], deviceInfo: { test: 'data' } })
    });
    expect(resp.status).toBe(500);
    const error = await resp.json();
    expect(error.error).toBe('Storage error');

    // Restore original put function
    env.STORAGE.put = originalPut;
  });

  it('stores and retrieves client data with pagination and filtering', async () => {
    const baseTime = 1707894000000; // Fixed timestamp for consistent string length
    const testData = {
      history: [
        { visitId: 'v1', visitTime: baseTime - 1000, title: 'Test Page 1', url: 'https://test1.com', platform: 'Windows', browserName: 'Chrome' },
        { visitId: 'v2', visitTime: baseTime - 2000, title: 'Test Page 2', url: 'https://test2.com', platform: 'Mac', browserName: 'Safari' },
        { visitId: 'v3', visitTime: baseTime - 3000, title: 'Another Page', url: 'https://test3.com', platform: 'Windows', browserName: 'Firefox' }
      ],
      deviceInfo: { key: 'value' }
    };
    const clientId = 'test123';

    // Store data
    const postResp = await makeRequest('/?clientId=' + clientId, {
      method: 'POST',
      body: JSON.stringify(testData)
    });
    expect(postResp.status).toBe(200);
    const postJson = await postResp.json();
    expect(postJson.message).toBe('Sync successful');

    // Verify the data was stored correctly
    const storedData = await env.STORAGE.get(`${clientId}/d`);
    const storedJson = JSON.parse(await storedData.text());
    expect(storedJson).toEqual(testData);

    // Verify metadata was stored
    const metadata = await env.METADATA.get(clientId, 'json');
    expect(metadata).toBeTruthy();
    expect(metadata.lastSync).toBeTruthy();
    expect(metadata.dataSize).toBeGreaterThan(0);

    // Test pagination
    const getResp1 = await makeRequest('/?clientId=' + clientId + '&page=1&pageSize=2');
    expect(getResp1.status).toBe(200);
    const getData1 = await getResp1.json();
    expect(getData1.pagination).toEqual({
      total: 3,
      page: 1,
      pageSize: 2,
      totalPages: 2
    });
    expect(getData1.history.length).toBe(2);

    // Test platform filter
    const getResp2 = await makeRequest('/?clientId=' + clientId + '&platform=Windows');
    expect(getResp2.status).toBe(200);
    const getData2 = await getResp2.json();
    expect(getData2.history.length).toBe(2);
    expect(getData2.history.every(item => item.platform === 'Windows')).toBe(true);

    // Test browser filter
    const getResp3 = await makeRequest('/?clientId=' + clientId + '&browser=Safari');
    expect(getResp3.status).toBe(200);
    const getData3 = await getResp3.json();
    expect(getData3.history.length).toBe(1);
    expect(getData3.history[0].browserName).toBe('Safari');

    // Test search filter
    const getResp4 = await makeRequest('/?clientId=' + clientId + '&searchQuery=another');
    expect(getResp4.status).toBe(200);
    const getData4 = await getResp4.json();
    expect(getData4.history.length).toBe(1);
    expect(getData4.history[0].title).toBe('Another Page');

    // Test date range filter
    const getResp5 = await makeRequest('/?clientId=' + clientId + '&startDate=' + (baseTime - 2500) + '&endDate=' + (baseTime - 500));
    expect(getResp5.status).toBe(200);
    const getData5 = await getResp5.json();
    expect(getData5.history.length).toBe(2);

    // Test combined filters
    const getResp6 = await makeRequest('/?clientId=' + clientId + '&platform=Windows&browser=Chrome&searchQuery=test');
    expect(getResp6.status).toBe(200);
    const getData6 = await getResp6.json();
    expect(getData6.history.length).toBe(1);
    expect(getData6.history[0].title).toBe('Test Page 1');
  });

  it('requires authentication for admin access', async () => {
    const resp = await makeRequest('/admin');
    expect(resp.status).toBe(401);
  });

  it('allows admin access with correct password', async () => {
    const resp = await makeRequest('/admin/clients', {
      headers: {
        'Authorization': 'Bearer francesisthebest'
      }
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('handles unsupported methods', async () => {
    const resp = await makeRequest('/?clientId=test123', {
      method: 'PUT'
    });
    expect(resp.status).toBe(405);
    expect(await resp.text()).toBe('Method not allowed');
  });

  describe('Admin Client Operations', () => {
    it('handles invalid client ID', async () => {
      const resp = await makeRequest('/?clientId=invalid/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });
      expect(resp.status).toBe(400);
      expect(await resp.text()).toBe('Invalid client ID');
    });
    const clientId = 'test_client';
    const testData = { test: 'data' };

    beforeEach(async () => {
      await env.STORAGE.put(`${clientId}/data`, JSON.stringify(testData));
      await env.METADATA.put(clientId, JSON.stringify({
        lastSync: new Date().toISOString(),
        dataSize: JSON.stringify(testData).length
      }));
    });

    it('handles unsupported methods', async () => {
      const resp = await makeRequest('/admin/client?clientId=test123', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(405);
      expect(await resp.text()).toBe('Method not allowed');
    });

    it('handles storage errors during deletion', async () => {
      const originalList = env.STORAGE.list;
      const originalDelete = env.STORAGE.delete;
      env.STORAGE.list = () => Promise.resolve({ objects: [{ key: 'test123/data' }] });
      env.STORAGE.delete = () => { throw new Error('Storage error'); };

      const resp = await makeRequest('/admin/client?clientId=test123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(500);
      expect(await resp.text()).toBe('Internal server error');

      // Restore original functions
      env.STORAGE.list = originalList;
      env.STORAGE.delete = originalDelete;
    });

    it('handles errors in client list', async () => {
      const originalList = env.STORAGE.list;
      env.STORAGE.list = () => { throw new Error('Storage error'); };

      const resp = await makeRequest('/admin/clients', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(500);
      expect(await resp.text()).toBe('Internal server error');

      // Restore original function
      env.STORAGE.list = originalList;
    });

    it('calculates client storage size', async () => {
      const clientId = 'test_client';
      const testData = { test: 'data' };
      
      // Setup test data
      await env.METADATA.put(clientId, JSON.stringify({
        lastSync: new Date().toISOString(),
        dataSize: JSON.stringify(testData).length
      }));
      await env.STORAGE.put(`${clientId}/data1`, JSON.stringify(testData));
      await env.STORAGE.put(`${clientId}/data2`, JSON.stringify(testData));

      // Mock storage list to return test objects
      env.STORAGE.list = () => Promise.resolve({
        objects: [
          { key: `${clientId}/data1`, size: 100 },
          { key: `${clientId}/data2`, size: 200 }
        ]
      });

      const resp = await makeRequest('/admin/clients', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      
      const clientData = data.find(c => c.clientId === clientId);
      expect(clientData).toBeTruthy();
      expect(clientData.dataSize).toBe(300); // 100 + 200
    });

    it('handles errors in client info', async () => {
      const originalGet = env.METADATA.get;
      env.METADATA.get = () => { throw new Error('KV error'); };

      const resp = await makeRequest('/admin/clients', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data[0].error).toBe('Error fetching client data');

      // Restore original function
      env.METADATA.get = originalGet;
    });

    it('deletes client data and metadata', async () => {
      const resp = await makeRequest('/admin/client?clientId=' + clientId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);
      expect(await resp.text()).toBe('Client deleted');

      // Verify data was deleted
      const metadata = await env.METADATA.get(clientId);
      expect(metadata).toBeNull();

      const data = await env.STORAGE.get(`${clientId}/d`);
      expect(data).toBeNull();
    });

    it('requires client ID for deletion', async () => {
      const resp = await makeRequest('/admin/client', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(400);
      expect(await resp.text()).toBe('Client ID required');
    });
  });

  describe('CORS Handling', () => {
    it('handles staging environment CORS', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        headers: { 'Origin': 'https://any-domain.com' }
      }, 'https://api-staging.chroniclesync.xyz');
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(resp.headers.get('Access-Control-Allow-Methods')).toBe('*');
      expect(resp.headers.get('Access-Control-Allow-Headers')).toBe('*');
      expect(resp.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(resp.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('handles localhost CORS', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        headers: { 'Origin': 'http://localhost:3000' }
      });
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    it('handles invalid origin CORS', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        headers: { 'Origin': 'https://evil.com' }
      });
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
    });

    it('handles OPTIONS request', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://chroniclesync.xyz' }
      });
      expect(resp.status).toBe(200);
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
    });
  });

  describe('Public Health Check', () => {
    let originalList;
    let originalGet;
    let originalPut;
    let originalDelete;

    beforeEach(async () => {
      // Save original functions
      originalList = env.STORAGE.list;
      originalGet = env.STORAGE.get;
      originalPut = env.STORAGE.put;
      originalDelete = env.STORAGE.delete;

      // Mock storage functions to return success
      env.STORAGE.list = () => Promise.resolve({ objects: [] });
      env.STORAGE.get = () => Promise.resolve({ text: () => Promise.resolve(JSON.stringify({ test: 'data' })) });
      env.STORAGE.put = () => Promise.resolve();
      env.STORAGE.delete = () => Promise.resolve();
    });

    afterEach(() => {
      // Restore original functions
      env.STORAGE.list = originalList;
      env.STORAGE.get = originalGet;
      env.STORAGE.put = originalPut;
      env.STORAGE.delete = originalDelete;
    });

    it('returns healthy status when all services are up', async () => {
      const resp = await makeRequest('/health');
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.healthy).toBe(true);
      expect(status.error).toBeNull();
      expect(status.timestamp).toBeTruthy();
    });

    it('returns unhealthy status when KV is down', async () => {
      const originalList = env.METADATA.list;
      env.METADATA.list = () => { throw new Error('KV error'); };

      const resp = await makeRequest('/health');
      expect(resp.status).toBe(503);

      const status = await resp.json();
      expect(status.healthy).toBe(false);
      expect(status.error).toBe('Storage connectivity issue');
      expect(status.timestamp).toBeTruthy();

      // Restore original list function
      env.METADATA.list = originalList;
    });

    it('returns unhealthy status when R2 is down', async () => {
      const originalList = env.STORAGE.list;
      env.STORAGE.list = () => { throw new Error('R2 error'); };

      const resp = await makeRequest('/health');
      expect(resp.status).toBe(503);

      const status = await resp.json();
      expect(status.healthy).toBe(false);
      expect(status.error).toBe('Storage connectivity issue');
      expect(status.timestamp).toBeTruthy();

      // Restore original list function
      env.STORAGE.list = originalList;
    });

    it('includes CORS headers in response', async () => {
      const resp = await makeRequest('/health', {
        headers: {
          'Origin': 'https://chroniclesync.xyz'
        }
      });
      expect(resp.status).toBe(200);
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
      expect(resp.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(resp.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });

  describe('Admin Workflow', () => {
    beforeEach(async () => {
      await env.METADATA.put('valid_client', JSON.stringify({
        lastSync: new Date().toISOString(),
        dataSize: 100
      }));
      await env.METADATA.put('invalid_client', JSON.stringify({
        lastSync: 'invalid-date',
        dataSize: 0
      }));
      await env.METADATA.put('orphaned_client', JSON.stringify({
        lastSync: new Date().toISOString(),
        dataSize: 0
      }));

      await env.STORAGE.put('valid_client/data', JSON.stringify({ test: 'data' }));
    });

    it('handles invalid request method', async () => {
      const resp = await makeRequest('/admin/workflow', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(405);
      expect(await resp.text()).toBe('Method not allowed');
    });

    it('handles workflow errors', async () => {
      const originalList = env.METADATA.list;
      env.METADATA.list = () => { throw new Error('Workflow error'); };

      const resp = await makeRequest('/admin/workflow', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer francesisthebest',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'check-metadata' })
      });
      expect(resp.status).toBe(500);
      const error = await resp.json();
      expect(error.error).toBe('Metadata operation failed');
      expect(error.details).toBe('Workflow error');

      // Restore original list function
      env.METADATA.list = originalList;
    });

    it('checks metadata integrity', async () => {
      const resp = await makeRequest('/admin/workflow', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer francesisthebest',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'check-metadata' })
      });
      expect(resp.status).toBe(200);

      const data = await resp.json();
      expect(data.status).toBe('completed');
      expect(data.message).toBe('Metadata check completed');
      expect(Array.isArray(data.results)).toBe(true);

      // Find results for each test client
      const validResult = data.results.find(r => r.clientId === 'valid_client');
      const invalidResult = data.results.find(r => r.clientId === 'invalid_client');
      const orphanedResult = data.results.find(r => r.clientId === 'orphaned_client');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(orphanedResult.valid).toBe(true);
    });

    it('handles errors during metadata cleanup', async () => {
      const originalStorageList = env.STORAGE.list;
      env.STORAGE.list = () => { throw new Error('Storage error during cleanup'); };

      const resp = await makeRequest('/admin/workflow', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer francesisthebest',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cleanup-metadata' })
      });
      expect(resp.status).toBe(200);

      const data = await resp.json();
      expect(data.status).toBe('completed');
      expect(data.results.errors.length).toBeGreaterThan(0);
      expect(data.results.errors[0].error).toBe('Storage error during cleanup');

      // Restore original function
      env.STORAGE.list = originalStorageList;
    });

    it('cleans up invalid and orphaned metadata', async () => {
      const resp = await makeRequest('/admin/workflow', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer francesisthebest',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cleanup-metadata' })
      });
      expect(resp.status).toBe(200);

      const data = await resp.json();
      expect(data.status).toBe('completed');
      expect(data.message).toBe('Metadata cleanup completed');
      expect(data.results.processed).toBe(3);
      expect(data.results.cleaned).toBe(2); // invalid_client and orphaned_client should be cleaned

      // Verify cleanup
      const validMetadata = await env.METADATA.get('valid_client');
      const invalidMetadata = await env.METADATA.get('invalid_client');
      const orphanedMetadata = await env.METADATA.get('orphaned_client');

      expect(validMetadata).toBeTruthy();
      expect(invalidMetadata).toBeNull();
      expect(orphanedMetadata).toBeNull();
    });

    it('rejects invalid workflow actions', async () => {
      const resp = await makeRequest('/admin/workflow', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer francesisthebest',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'invalid-action' })
      });
      expect(resp.status).toBe(400);
      expect(await resp.text()).toBe('Invalid action');
    });
  });

  describe('Admin Status', () => {
    let originalStorageList;
    let originalStorageGet;
    let originalStoragePut;
    let originalStorageDelete;
    let originalMetadataList;

    beforeEach(() => {
      // Save original functions
      originalStorageList = env.STORAGE.list;
      originalStorageGet = env.STORAGE.get;
      originalStoragePut = env.STORAGE.put;
      originalStorageDelete = env.STORAGE.delete;
      originalMetadataList = env.METADATA.list;

      // Mock storage functions to return success
      env.STORAGE.list = () => Promise.resolve({ objects: [] });
      env.STORAGE.get = () => Promise.resolve({ text: () => Promise.resolve(JSON.stringify({ test: 'data' })) });
      env.STORAGE.put = () => Promise.resolve();
      env.STORAGE.delete = () => Promise.resolve();
      env.METADATA.list = () => Promise.resolve({ keys: [] });
    });

    afterEach(() => {
      // Restore original functions
      env.STORAGE.list = originalStorageList;
      env.STORAGE.get = originalStorageGet;
      env.STORAGE.put = originalStoragePut;
      env.STORAGE.delete = originalStorageDelete;
      env.METADATA.list = originalMetadataList;
    });

    it('returns status of all services', async () => {
      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.worker.version).toBe('1.0.0');
      expect(status.worker.timestamp).toBeTruthy();

      expect(status.metadata.status).toBe(true);
      expect(status.metadata.details).toBe('All KV tests passed');
      expect(status.metadata.error).toBeNull();
      expect(status.metadata.tests.connection).toBe(true);
      expect(status.metadata.tests.write_test).toBe(true);
      expect(status.metadata.tests.read_test).toBe(true);
      expect(status.metadata.tests.delete_test).toBe(true);
      expect(status.metadata.tests.list_test).toBe(true);

      expect(status.storage.status).toBe(true);
      expect(status.storage.details).toBe('All storage tests passed');
      expect(status.storage.error).toBeNull();
      expect(status.storage.tests.connection).toBe(true);
      expect(status.storage.tests.write_test).toBe(true);
      expect(status.storage.tests.read_test).toBe(true);
      expect(status.storage.tests.delete_test).toBe(true);
    });

    it('handles KV failures', async () => {
      env.METADATA.list = () => { throw new Error('KV error'); };

      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(false);
      expect(status.metadata.error).toBe('KV error');
      expect(status.storage.status).toBe(true);
    });

    it('handles R2 failures', async () => {
      env.STORAGE.list = () => { throw new Error('R2 error'); };

      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(true);
      expect(status.storage.status).toBe(false);
      expect(status.storage.error).toBe('R2 error');
    });
  });

  describe('CORS Headers', () => {
    describe('Production Environment', () => {
      beforeEach(() => {
        // Mock production URL
        // eslint-disable-next-line no-func-assign
        makeRequest = (path, init) => {
          const url = new URL(path, 'https://api.chroniclesync.xyz');
          return worker.fetch(new Request(url, init), getMiniflareBindings());
        };
      });

      it('handles production domain', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'https://chroniclesync.xyz' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
      });

      it('handles localhost', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'http://localhost:8787' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8787');
      });

      it('handles disallowed origin', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'https://evil.com' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
      });
    });

    describe('Staging Environment', () => {
      beforeEach(() => {
        // Mock staging URL
        // eslint-disable-next-line no-func-assign
        makeRequest = (path, init) => {
          const url = new URL(path, 'https://api-staging.chroniclesync.xyz');
          return worker.fetch(new Request(url, init), getMiniflareBindings());
        };
      });

      it('allows any origin', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'https://any-domain.com' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(resp.headers.get('Access-Control-Allow-Methods')).toBe('*');
        expect(resp.headers.get('Access-Control-Allow-Headers')).toBe('*');
        expect(resp.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      });

      it('allows pages.dev domains', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'https://add-history-view.chroniclesync-pages.pages.dev' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });

      it('allows localhost in staging', async () => {
        const resp = await makeRequest('/?clientId=test123', {
          headers: { Origin: 'http://localhost:3000' }
        });
        expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });
    });
  });
});