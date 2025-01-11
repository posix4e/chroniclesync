function formatDate(date) {
  // Format: Thu, 01 Jan 1970 00:00:00 GMT
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const d = new Date(date);
  const dayName = days[d.getUTCDay()];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  console.log(JSON.stringify(logEntry));
}

import MetadataService from './services/metadata.js';

export default {
  corsHeaders(origin = '*') {
    const allowedDomains = [
      'chroniclesync.xyz',
      'chroniclesync-pages.pages.dev',
      'localhost:8787',
      'localhost:8788',
      '127.0.0.1:8787',
      '127.0.0.1:8788'
    ];
    
    const isAllowed = origin === '*' ? false : allowedDomains.some(domain => {
      if (domain.startsWith('localhost') || domain.startsWith('127.0.0.1')) {
        return origin === `http://${domain}`;
      }
      if (domain === 'chroniclesync-pages.pages.dev') {
        return origin.endsWith('.chroniclesync-pages.pages.dev') || 
          origin === `https://${domain}`;
      }
      return origin === `https://${domain}`;
    });
    
    const finalOrigin = isAllowed ? origin : 'https://chroniclesync.xyz';
    
    return {
      'Access-Control-Allow-Origin': finalOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const origin = request.headers.get('Origin') || '*';

    log('info', 'Request received', {
      method: request.method,
      url: url.toString(),
      clientId,
      origin,
      path: url.pathname
    });

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: this.corsHeaders(origin),
      });
    }

    // Admin endpoints
    if (url.pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== 'Bearer francesisthebest') {
        return new Response('Unauthorized', { 
          status: 401,
          headers: this.corsHeaders()
        });
      }

      // Admin routes
      if (url.pathname === '/admin/clients') {
        return await this.handleAdminClients(request, env);
      }

      if (url.pathname === '/admin/client') {
        return await this.handleAdminClient(request, env, clientId);
      }

      if (url.pathname === '/admin/status') {
        return await this.handleAdminStatus(request, env);
      }

      if (url.pathname === '/admin/workflow') {
        return await this.handleAdminWorkflow(request, env);
      }
    }

    // Public health check endpoint
    if (url.pathname === '/health') {
      return await this.handleHealthCheck(request, env);
    }

    // Client endpoints
    if (!clientId) {
      return new Response('Client ID required', { 
        status: 400,
        headers: this.corsHeaders()
      });
    }

    if (request.method === 'GET') {
      return await this.handleClientGet(request, env, clientId);
    }

    if (request.method === 'POST') {
      return await this.handleClientPost(request, env, clientId);
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: this.corsHeaders()
    });
  },

  async handleAdminClients(request, env) {
    try {
      const metadataService = new MetadataService(env);
      const { keys } = await metadataService.list();
      
      const stats = [];
      for (const key of keys) {
        try {
          const metadata = await metadataService.get(key.name);
          if (!metadata) continue;

          const objects = await env.STORAGE.list({ prefix: `${key.name}/` });
          let totalSize = 0;
          for (const obj of objects.objects) {
            totalSize += obj.size;
          }
          stats.push({
            clientId: key.name,
            lastSync: metadata.lastSync,
            dataSize: totalSize,
          });
        } catch (e) {
          log('error', 'Error getting client info', { clientId: key.name, error: e.message });
          if (e.message === 'Storage error') {
            throw e;
          }
          stats.push({
            clientId: key.name,
            lastSync: null,
            dataSize: 0,
            error: 'Error fetching client data',
          });
        }
      }

      return new Response(JSON.stringify(stats), { 
        headers: {
          'Content-Type': 'application/json',
          ...this.corsHeaders()
        }
      });
    } catch (e) {
      log('error', 'Error getting client list', { error: e.message });
      return new Response('Internal server error', { 
        status: 500,
        headers: this.corsHeaders()
      });
    }
  },

  async handleAdminClient(request, env, clientId) {
    const origin = request.headers.get('Origin') || '*';
    if (!clientId) {
      return new Response('Client ID required', { 
        status: 400,
        headers: this.corsHeaders(origin)
      });
    }

    if (request.method === 'DELETE') {
      try {
        // Delete client data from R2
        const objects = await env.STORAGE.list({ prefix: `${clientId}/` });
        for (const obj of objects.objects) {
          await env.STORAGE.delete(obj.key);
        }

        // Delete metadata from KV
        const metadataService = new MetadataService(env);
        await metadataService.delete(clientId);

        log('info', 'Client deleted successfully', { clientId });
        return new Response('Client deleted', { 
          status: 200,
          headers: this.corsHeaders(origin)
        });
      } catch (e) {
        log('error', 'Error deleting client', { error: e.message });
        return new Response('Internal server error', { 
          status: 500,
          headers: this.corsHeaders(origin)
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: this.corsHeaders(origin)
    });
  },

  async handleAdminStatus(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const status = {
      worker: {
        status: true,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      metadata: {
        status: false,
        details: null,
        error: null,
        tests: {
          connection: false,
          write_test: false,
          read_test: false,
          delete_test: false,
          list_test: false
        }
      },
      storage: {
        status: false,
        details: null,
        error: null,
        tests: {
          connection: false,
          write_test: false,
          read_test: false,
          delete_test: false
        }
      }
    };

    // Test KV Store
    log('info', 'Starting KV status check');
    try {
      const metadataService = new MetadataService(env);
      const testKey = '_test_status_check_' + Date.now();
      const testData = { lastSync: new Date().toISOString(), dataSize: 0 };

      // Test 1: List operation (connection test)
      await metadataService.list({ limit: 1 });
      status.metadata.tests.connection = true;
      status.metadata.tests.list_test = true;

      // Test 2: Write Test
      await metadataService.put(testKey, testData);
      status.metadata.tests.write_test = true;

      // Test 3: Read Test
      const readData = await metadataService.get(testKey);
      status.metadata.tests.read_test = readData && readData.lastSync === testData.lastSync;

      // Test 4: Delete Test
      await metadataService.delete(testKey);
      status.metadata.tests.delete_test = true;

      // Overall metadata status
      status.metadata.status = true;
      status.metadata.details = 'All KV tests passed';
      log('info', 'KV status check completed successfully', status.metadata);
    } catch (e) {
      log('error', 'KV check failed', { error: e.message });
      status.metadata.error = e.message;
      status.metadata.details = 'KV tests failed';
    }

    // Test Storage
    log('info', 'Starting storage status check');
    try {
      const testKey = '_test_status_check_' + Date.now();
      const testData = JSON.stringify({ test: 'data' });

      // Test 1: Connection (List operation)
      await env.STORAGE.list({ limit: 1 });
      status.storage.tests.connection = true;

      // Test 2: Write Test
      await env.STORAGE.put(testKey, testData);
      status.storage.tests.write_test = true;

      // Test 3: Read Test
      const readResult = await env.STORAGE.get(testKey);
      const readData = await readResult.text();
      status.storage.tests.read_test = readData === testData;

      // Test 4: Delete Test
      await env.STORAGE.delete(testKey);
      status.storage.tests.delete_test = true;

      // Overall storage status
      status.storage.status = true;
      status.storage.details = 'All storage tests passed';
      log('info', 'Storage status check completed successfully', status.storage);
    } catch (e) {
      log('error', 'Storage check failed', { error: e.message });
      status.storage.error = e.message;
      status.storage.details = 'Storage tests failed';
    }

    return new Response(JSON.stringify(status), { 
      headers: {
        'Content-Type': 'application/json',
        ...this.corsHeaders(origin)
      }
    });
  },

  async handleAdminWorkflow(request, env) {
    const origin = request.headers.get('Origin') || '*';
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: this.corsHeaders(origin)
      });
    }

    const { action } = await request.json();
    
    const validActions = ['check-metadata', 'cleanup-metadata'];
    if (!validActions.includes(action)) {
      return new Response('Invalid action', { 
        status: 400,
        headers: this.corsHeaders(origin)
      });
    }

    try {
      if (action === 'check-metadata') {
        const metadataService = new MetadataService(env);
        const { keys } = await metadataService.list();
        const results = [];
        
        for (const key of keys) {
          const metadata = await metadataService.get(key.name);
          results.push({
            clientId: key.name,
            valid: await metadataService.validateMetadata(metadata),
            metadata
          });
        }

        log('info', 'Metadata check completed', { results });
        return new Response(JSON.stringify({
          message: 'Metadata check completed',
          status: 'completed',
          results
        }), { 
          headers: {
            'Content-Type': 'application/json',
            ...this.corsHeaders(origin)
          }
        });
      }

      if (action === 'cleanup-metadata') {
        const metadataService = new MetadataService(env);
        const { keys } = await metadataService.list();
        const results = {
          processed: 0,
          cleaned: 0,
          errors: []
        };
        
        for (const key of keys) {
          try {
            results.processed++;
            const metadata = await metadataService.get(key.name);
            
            // Check if metadata is invalid or if the client has no data in R2
            if (!await metadataService.validateMetadata(metadata)) {
              await metadataService.delete(key.name);
              results.cleaned++;
              continue;
            }

            const objects = await env.STORAGE.list({ prefix: `${key.name}/` });
            if (!objects.objects.length) {
              await metadataService.delete(key.name);
              results.cleaned++;
            }
          } catch (e) {
            results.errors.push({ clientId: key.name, error: e.message });
          }
        }
        
        log('info', 'Metadata cleanup completed', results);
        return new Response(JSON.stringify({
          message: 'Metadata cleanup completed',
          status: 'completed',
          results
        }), { 
          headers: {
            'Content-Type': 'application/json',
            ...this.corsHeaders(origin)
          }
        });
      }
    } catch (error) {
      log('error', 'Metadata operation failed', { error: error.message });
      return new Response(JSON.stringify({
        error: 'Metadata operation failed',
        details: error.message
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.corsHeaders(origin)
        }
      });
    }
  },

  async handleHealthCheck(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const response = {
      healthy: true,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Test KV Store connection
      const metadataService = new MetadataService(env);
      await metadataService.list({ limit: 1 });

      // Test R2 Storage connection
      await env.STORAGE.list({ limit: 1 });
    } catch (error) {
      response.healthy = false;
      response.error = 'Storage connectivity issue';
      log('error', 'Health check failed', { error: error.message });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...this.corsHeaders(origin)
      },
      status: response.healthy ? 200 : 503
    });
  },

  async handleClientGet(request, env, clientId) {
    const origin = request.headers.get('Origin') || '*';
    const data = await env.STORAGE.get(`${clientId}/data`);
    if (!data) {
      return new Response('No data found', { 
        status: 404,
        headers: this.corsHeaders(origin)
      });
    }

    return new Response(data.body, {
      headers: {
        'Content-Type': 'application/json',
        'Last-Modified': formatDate(data.uploaded),
        ...this.corsHeaders(origin)
      },
    });
  },

  async handleClientPost(request, env, clientId) {
    const origin = request.headers.get('Origin') || '*';
    
    // Validate client ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
      return new Response('Invalid client ID', { 
        status: 400,
        headers: this.corsHeaders(origin)
      });
    }
    
    try {
      const data = await request.json();
      
      // Store in R2
      await env.STORAGE.put(`${clientId}/data`, JSON.stringify(data));

      // Update client metadata in KV
      const metadataService = new MetadataService(env);
      await metadataService.updateClientMetadata(clientId, JSON.stringify(data).length);

      log('info', 'Client data synced successfully', { clientId });
      return new Response(JSON.stringify({ message: 'Sync successful' }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.corsHeaders(origin)
        }
      });
    } catch (error) {
      log('error', 'Error in handleClientPost', { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.corsHeaders(origin)
        }
      });
    }
  },
};