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
      // Check if table exists
      try {
        const tableCheck = await env.DB.prepare(
          'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'clients\''
        ).all();
        console.log('Table check result:', tableCheck);
        
        if (!tableCheck.results || tableCheck.results.length === 0) {
          return new Response('Database table not found', { 
            status: 500,
            headers: this.corsHeaders()
          });
        }
      } catch (dbError) {
        log('error', 'Error checking table', { error: dbError.message });
        return new Response('Database error: ' + dbError.message, { 
          status: 500,
          headers: this.corsHeaders()
        });
      }
      
      const clients = await env.DB.prepare(
        'SELECT client_id, last_sync, data_size FROM clients'
      ).all();

      const stats = [];
      for (const client of clients.results) {
        try {
          const objects = await env.STORAGE.list({ prefix: `${client.client_id}/` });
          let totalSize = 0;
          for (const obj of objects.objects) {
            totalSize += obj.size;
          }
          stats.push({
            clientId: client.client_id,
            lastSync: client.last_sync,
            dataSize: totalSize,
          });
        } catch (e) {
          log('error', 'Error getting storage info for client', { clientId: client.client_id, error: e.message });
          stats.push({
            clientId: client.client_id,
            lastSync: client.last_sync,
            dataSize: 0,
            error: 'Storage error',
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
        // Delete client data
        const objects = await env.STORAGE.list({ prefix: `${clientId}/` });
        for (const obj of objects.objects) {
          await env.STORAGE.delete(obj.key);
        }

        // Delete from database
        await env.DB.prepare('DELETE FROM clients WHERE client_id = ?')
          .bind(clientId)
          .run();

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
      database: {
        status: false,
        details: null,
        error: null,
        tests: {
          connection: false,
          table_exists: false,
          write_test: false,
          read_test: false
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

    // Test Database
    log('info', 'Starting database status check');
    try {
      // Test 1: Basic Connection
      const connTest = await env.DB.prepare('SELECT 1 as test').first();
      status.database.tests.connection = connTest.test === 1;

      // Test 2: Check if clients table exists
      const tableCheck = await env.DB.prepare(
        'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'clients\''
      ).first();
      status.database.tests.table_exists = tableCheck !== null;

      // Test 3: Write Test
      const testClientId = '_test_status_check_' + Date.now();
      await env.DB.prepare(
        'INSERT OR REPLACE INTO clients (client_id, last_sync, data_size) VALUES (?, datetime("now"), ?)'
      ).bind(testClientId, 0).run();
      status.database.tests.write_test = true;

      // Test 4: Read Test
      const readTest = await env.DB.prepare(
        'SELECT client_id FROM clients WHERE client_id = ?'
      ).bind(testClientId).first();
      status.database.tests.read_test = readTest.client_id === testClientId;

      // Cleanup
      await env.DB.prepare('DELETE FROM clients WHERE client_id = ?').bind(testClientId).run();

      // Overall database status
      status.database.status = true;
      status.database.details = 'All database tests passed';
      log('info', 'Database status check completed successfully', status.database);
    } catch (e) {
      log('error', 'Database check failed', { error: e.message });
      status.database.error = e.message;
      status.database.details = 'Database tests failed';
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
    
    const validActions = ['init-database', 'check-tables', 'repair-tables'];
    if (!validActions.includes(action)) {
      return new Response('Invalid action', { 
        status: 400,
        headers: this.corsHeaders(origin)
      });
    }

    try {
      if (action === 'init-database') {
        // Create the clients table if it doesn't exist
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS clients (
            client_id TEXT PRIMARY KEY,
            last_sync DATETIME,
            data_size INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // Create indexes for better performance
        await env.DB.batch([
          env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_last_sync ON clients(last_sync)'),
          env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_created_at ON clients(created_at)')
        ]);

        log('info', 'Database initialized successfully');
        return new Response(JSON.stringify({
          message: 'Database initialized successfully',
          status: 'completed'
        }), { 
          headers: {
            'Content-Type': 'application/json',
            ...this.corsHeaders(origin)
          }
        });
      }

      if (action === 'check-tables') {
        // Check table structure and indexes
        const tables = await env.DB.prepare(`
          SELECT name, sql FROM sqlite_master 
          WHERE type='table' AND name='clients'
        `).all();

        const indexes = await env.DB.prepare(`
          SELECT name, sql FROM sqlite_master 
          WHERE type='index' AND tbl_name='clients'
        `).all();

        log('info', 'Database check completed', { tables: tables.results, indexes: indexes.results });
        return new Response(JSON.stringify({
          message: 'Database check completed',
          status: 'completed',
          tables: tables.results,
          indexes: indexes.results
        }), { 
          headers: {
            'Content-Type': 'application/json',
            ...this.corsHeaders(origin)
          }
        });
      }

      if (action === 'repair-tables') {
        // Analyze and repair tables
        await env.DB.prepare('ANALYZE clients').run();
        await env.DB.prepare('VACUUM').run();
        
        // Verify table integrity
        const integrityCheck = await env.DB.prepare('PRAGMA integrity_check').all();
        
        log('info', 'Database repair completed', { integrityCheck: integrityCheck.results });
        return new Response(JSON.stringify({
          message: 'Database repair completed',
          status: 'completed',
          integrityCheck: integrityCheck.results
        }), { 
          headers: {
            'Content-Type': 'application/json',
            ...this.corsHeaders(origin)
          }
        });
      }
    } catch (error) {
      log('error', 'Database operation failed', { error: error.message });
      return new Response(JSON.stringify({
        error: 'Database operation failed',
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
    
    try {
      const data = await request.json();
      
      // Store in R2
      await env.STORAGE.put(`${clientId}/data`, JSON.stringify(data));

      // Update client info in D1
      await env.DB.prepare(
        `INSERT OR REPLACE INTO clients (client_id, last_sync, data_size) 
         VALUES (?, datetime('now'), ?)`
      ).bind(clientId, JSON.stringify(data).length).run();

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