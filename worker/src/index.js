function formatDate(date) {
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
      const clients = new Set();
      const objects = await env.STORAGE.list();
      
      for (const obj of objects.objects) {
        const clientId = obj.key.split('/')[0];
        clients.add(clientId);
      }

      const stats = [];
      for (const clientId of clients) {
        try {
          const clientObjects = await env.STORAGE.list({ prefix: `${clientId}/` });
          let totalSize = 0;
          let lastSync = null;
          
          for (const obj of clientObjects.objects) {
            totalSize += obj.size;
            if (obj.uploaded > lastSync) {
              lastSync = obj.uploaded;
            }
          }
          
          stats.push({
            clientId,
            lastSync,
            dataSize: totalSize,
          });
        } catch (e) {
          log('error', 'Error getting storage info for client', { clientId, error: e.message });
          stats.push({
            clientId,
            lastSync: null,
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