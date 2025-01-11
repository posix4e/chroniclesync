import worker from './index.js';
import './test-setup.js';

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function makeRequest(path, init) {
  const url = new URL(path, 'https://api.chroniclesync.xyz');
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
      body: JSON.stringify({ test: 'data' })
    });
    expect(resp.status).toBe(500);
    const error = await resp.json();
    expect(error.error).toBe('Storage error');

    // Restore original put function
    env.STORAGE.put = originalPut;
  });

  it('stores and retrieves client data', async () => {
    const testData = { key: 'value' };
    const clientId = 'test123';

    // Store data
    const postResp = await makeRequest('/?clientId=' + clientId, {
      method: 'POST',
      body: JSON.stringify(testData)
    });
    expect(postResp.status).toBe(200);
    const postJson = await postResp.json();
    expect(postJson.message).toBe('Sync successful');

    // Verify metadata was stored
    const metadata = await env.METADATA.get(clientId, 'json');
    expect(metadata).toBeTruthy();
    expect(metadata.lastSync).toBeTruthy();
    expect(metadata.dataSize).toBe(JSON.stringify(testData).length);

    // Retrieve data
    const getResp = await makeRequest('/?clientId=' + clientId);
    expect(getResp.status).toBe(200);
    expect(getResp.headers.get('Content-Type')).toBe('application/json');
    expect(getResp.headers.get('Last-Modified')).toBeTruthy();
    const getData = await getResp.json();
    expect(getData).toEqual(testData);
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

      const data = await env.STORAGE.get(`${clientId}/data`);
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

  describe('Admin Status Check', () => {
    let originalList;
    let originalGet;
    let originalPut;
    let originalDelete;

    beforeEach(async () => {
      await env.METADATA.put('_test_status_check_123', JSON.stringify({
        lastSync: new Date().toISOString(),
        dataSize: 100
      }));
      await env.STORAGE.put('_test_status_check_123/data', JSON.stringify({ test: 'data' }));

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

    it('handles test client data', async () => {
      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(true);
      expect(status.storage.status).toBe(true);
    });

    it('handles missing test client data', async () => {
      await env.METADATA.delete('_test_status_check_123');

      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(true);
      expect(status.storage.status).toBe(true);
    });

    it('handles invalid JSON in client data', async () => {
      await env.STORAGE.put('_test_status_check_123/data', 'invalid json');

      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(true);
      expect(status.storage.status).toBe(true);
    });

    it('handles KV errors', async () => {
      const originalList = env.METADATA.list;
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

      // Restore original list function
      env.METADATA.list = originalList;
    });

    it('handles R2 errors', async () => {
      const originalList = env.STORAGE.list;
      env.STORAGE.list = () => { throw new Error('R2 error'); };

      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.storage.status).toBe(false);
      expect(status.storage.error).toBe('R2 error');

      // Restore original list function
      env.STORAGE.list = originalList;
    });

    it('performs comprehensive status check', async () => {
      const resp = await makeRequest('/admin/status', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(resp.status).toBe(200);

      const status = await resp.json();
      expect(status.worker.status).toBe(true);
      expect(status.metadata.status).toBe(true);
      expect(status.storage.status).toBe(true);

      // Verify KV tests
      expect(status.metadata.tests.connection).toBe(true);
      expect(status.metadata.tests.write_test).toBe(true);
      expect(status.metadata.tests.read_test).toBe(true);
      expect(status.metadata.tests.delete_test).toBe(true);
      expect(status.metadata.tests.list_test).toBe(true);

      // Verify R2 tests
      expect(status.storage.tests.connection).toBe(true);
      expect(status.storage.tests.write_test).toBe(true);
      expect(status.storage.tests.read_test).toBe(true);
      expect(status.storage.tests.delete_test).toBe(true);
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

  describe('CORS Headers', () => {
    it('handles production domain', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        headers: { Origin: 'https://chroniclesync.xyz' }
      });
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://chroniclesync.xyz');
    });

    it('handles pages.dev subdomain', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        headers: { Origin: 'https://my-branch.chroniclesync-pages.pages.dev' }
      });
      expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('https://my-branch.chroniclesync-pages.pages.dev');
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

    it('handles OPTIONS request', async () => {
      const resp = await makeRequest('/?clientId=test123', {
        method: 'OPTIONS',
        headers: { Origin: 'https://chroniclesync.xyz' }
      });
      expect(resp.status).toBe(200);
      expect(resp.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(resp.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(resp.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });
});