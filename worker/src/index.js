export default {
  corsHeaders(origin = '*') {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: this.corsHeaders(),
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
        console.error('Error checking table:', dbError);
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
          const totalSize = objects.objects.reduce((acc, obj) => acc + obj.size, 0);
          stats.push({
            clientId: client.client_id,
            lastSync: client.last_sync,
            dataSize: totalSize,
          });
        } catch (e) {
          console.error(`Error getting storage info for client ${client.client_id}:`, e);
          stats.push({
            clientId: client.client_id,
            lastSync: client.last_sync,
            dataSize: 0,
            error: 'Storage error',
          });
        }
      }

      return Response.json(stats, { headers: this.corsHeaders() });
    } catch (e) {
      console.error('Error getting client list:', e);
      return new Response('Internal server error', { 
        status: 500,
        headers: this.corsHeaders()
      });
    }
  },

  async handleAdminClient(request, env, clientId) {
    if (!clientId) {
      return new Response('Client ID required', { status: 400 });
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

        return new Response('Client deleted', { 
          status: 200,
          headers: this.corsHeaders()
        });
      } catch (e) {
        console.error('Error deleting client:', e);
        return new Response('Internal server error', { 
          status: 500,
          headers: this.corsHeaders()
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },

  async handleAdminStatus(request, env) {
    const status = {
      production: {
        worker: true,
        database: false,
        storage: false,
      },
      staging: {
        worker: true,
        database: false,
        storage: false,
      },
    };

    try {
      // Check database
      await env.DB.prepare('SELECT 1').run();
      status.production.database = true;
    } catch (e) {
      console.error('Database check failed:', e);
    }

    try {
      // Check storage
      await env.STORAGE.head('test-key');
      status.production.storage = true;
    } catch (e) {
      console.error('Storage check failed:', e);
    }

    return Response.json(status, { headers: this.corsHeaders() });
  },

  async handleAdminWorkflow(request, _env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { action, environment } = await request.json();
    
    // These actions are now handled by GitHub Actions
    const validActions = ['create-resources', 'update-schema', 'reset-database'];
    if (!validActions.includes(action)) {
      return new Response('Invalid action', { status: 400 });
    }

    if (!['production', 'staging'].includes(environment)) {
      return new Response('Invalid environment', { status: 400 });
    }

    // In a real implementation, this would trigger the GitHub workflow
    // For now, we'll just return success
    return Response.json({
      message: `Triggered ${action} workflow for ${environment} environment`,
      status: 'pending',
    }, { headers: this.corsHeaders() });
  },

  async handleClientGet(request, env, clientId) {
    const data = await env.STORAGE.get(`${clientId}/data`);
    if (!data) {
      return new Response('No data found', { status: 404 });
    }

    return new Response(data.body, {
      headers: {
        'Content-Type': 'application/json',
        'Last-Modified': data.uploaded.toISOString(),
        ...this.corsHeaders()
      },
    });
  },

  async handleClientPost(request, env, clientId) {
    const data = await request.json();
    
    // Store in R2
    await env.STORAGE.put(`${clientId}/data`, JSON.stringify(data));

    // Update client info in D1
    await env.DB.prepare(
      `INSERT OR REPLACE INTO clients (client_id, last_sync, data_size) 
       VALUES (?, datetime('now'), ?)`
    ).bind(clientId, JSON.stringify(data).length).run();

    return new Response('Sync successful', { 
      status: 200,
      headers: this.corsHeaders()
    });
  },
};