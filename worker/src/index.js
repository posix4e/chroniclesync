export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return new Response('Client ID required', { status: 400 });
    }

    if (request.method === 'GET') {
      if (url.pathname === '/admin') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== 'Bearer francesisthebest') {
          return new Response('Unauthorized', { status: 401 });
        }

        // Get all client stats
        const clients = await env.DB.prepare(
          'SELECT client_id, last_sync, data_size FROM clients'
        ).all();

        const stats = [];
        for (const client of clients.results) {
          const objects = await env.STORAGE.list({ prefix: `${client.client_id}/` });
          const totalSize = objects.objects.reduce((acc, obj) => acc + obj.size, 0);
          stats.push({
            clientId: client.client_id,
            lastSync: client.last_sync,
            dataSize: totalSize
          });
        }

        return Response.json(stats);
      }

      // Get client's data
      const data = await env.STORAGE.get(`${clientId}/data`);
      if (!data) {
        return new Response('No data found', { status: 404 });
      }

      return new Response(data.body, {
        headers: {
          'Content-Type': 'application/json',
          'Last-Modified': data.uploaded.toISOString()
        }
      });
    }

    if (request.method === 'POST') {
      const data = await request.json();
      
      // Store in R2
      await env.STORAGE.put(`${clientId}/data`, JSON.stringify(data));

      // Update client info in D1
      await env.DB.prepare(
        `INSERT OR REPLACE INTO clients (client_id, last_sync, data_size) 
         VALUES (?, datetime('now'), ?)`
      ).bind(clientId, JSON.stringify(data).length).run();

      return new Response('Sync successful', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  }
}