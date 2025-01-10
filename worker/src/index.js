// Mock storage for development
const storage = new Map();
const mockStorage = {
  async get(key) {
    const stored = storage.get(key);
    return stored ? {
      body: stored,
      uploaded: new Date()
    } : null;
  },
  async put(key, value) {
    storage.set(key, value);
  },
  async list({ prefix }) {
    const objects = [];
    for (const [key, value] of storage.entries()) {
      if (key.startsWith(prefix)) {
        objects.push({
          key,
          size: value.length
        });
      }
    }
    return { objects };
  },
  async delete(key) {
    storage.delete(key);
  },
  async head() {
    return true;
  }
};

// Mock database for development
const mockDb = {
  async prepare(_query) {
    const tables = {};
    return {
      async all() {
        return { results: Object.values(tables.clients || {}) };
      },
      async run() {
        return true;
      },
      bind(..._args) {
        return this;
      }
    };
  }
};

// Export mock implementations for testing
export { mockDb, mockStorage };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    
    // Use mock implementations in development
    env = {
      ...env,
      STORAGE: env.STORAGE || mockStorage,
      DB: env.DB || mockDb
    };

    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' });
    }

    // Admin endpoints
    if (url.pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== 'Bearer francesisthebest') {
        return new Response('Unauthorized', { status: 401 });
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
      return new Response('Client ID required', { status: 400 });
    }

    if (request.method === 'GET') {
      return await this.handleClientGet(request, env, clientId);
    }

    if (request.method === 'POST') {
      return await this.handleClientPost(request, env, clientId);
    }

    return new Response('Method not allowed', { status: 405 });
  },

  async handleAdminClients(_request, env) {
    const { DB: db, STORAGE: storage } = env;
    try {
      const clients = await db.prepare(
        'SELECT client_id, last_sync, data_size FROM clients'
      ).all();

      const stats = [];
      for (const client of clients.results) {
        try {
          const objects = await storage.list({ prefix: `${client.client_id}/` });
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

      return Response.json(stats);
    } catch (e) {
      console.error('Error getting client list:', e);
      return new Response('Internal server error', { status: 500 });
    }
  },

  async handleAdminClient(request, env, clientId) {
    const { DB: db, STORAGE: storage } = env;
    if (!clientId) {
      return new Response('Client ID required', { status: 400 });
    }

    if (request.method === 'DELETE') {
      try {
        // Delete client data
        const objects = await storage.list({ prefix: `${clientId}/` });
        for (const obj of objects.objects) {
          await storage.delete(obj.key);
        }

        // Delete from database
        await db.prepare('DELETE FROM clients WHERE client_id = ?')
          .bind(clientId)
          .run();

        return new Response('Client deleted', { status: 200 });
      } catch (e) {
        console.error('Error deleting client:', e);
        return new Response('Internal server error', { status: 500 });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },

  async handleAdminStatus(_request, env) {
    const { DB: db, STORAGE: storage } = env;
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
      await db.prepare('SELECT 1').run();
      status.production.database = true;
    } catch (e) {
      console.error('Database check failed:', e);
    }

    try {
      // Check storage
      await storage.head('test-key');
      status.production.storage = true;
    } catch (e) {
      console.error('Storage check failed:', e);
    }

    return Response.json(status);
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
    });
  },

  async handleClientGet(_request, env, clientId) {
    const { STORAGE: storage } = env;
    const data = await storage.get(`${clientId}/data`);
    if (!data) {
      return new Response('No data found', { status: 404 });
    }

    return new Response(data.body, {
      headers: {
        'Content-Type': 'application/json',
        'Last-Modified': data.uploaded.toISOString(),
      },
    });
  },

  async handleClientPost(request, env, clientId) {
    const { DB: db, STORAGE: storage } = env;
    const data = await request.json();
    
    try {
      // Store in R2
      await storage.put(`${clientId}/data`, JSON.stringify(data));

      // Update client info in D1
      await db.prepare(
        `INSERT OR REPLACE INTO clients (client_id, last_sync, data_size) 
         VALUES (?, datetime('now'), ?)`
      ).bind(clientId, JSON.stringify(data).length).run();

      return new Response('Sync successful', { status: 200 });
    } catch (e) {
      console.error('Error storing client data:', e);
      return new Response('Internal server error', { status: 500 });
    }
  },
};