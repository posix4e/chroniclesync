const { createServer } = require('http');

class MockWorkerServer {
  constructor(port = 8787) {
    this.port = port;
    this.clients = new Map();
    this.server = null;
  }

  start() {
    this.server = createServer((req, res) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => this.handleRequest(req, res, Buffer.concat(chunks)));
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const clientId = url.searchParams.get('clientId');
    const adminAuth = req.headers['x-admin-key'];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Admin endpoints
    if (url.pathname.startsWith('/admin')) {
      if (adminAuth !== 'test-admin-key') {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      if (url.pathname === '/admin/clients') {
        if (req.method === 'GET') {
          res.writeHead(200);
          res.end(JSON.stringify([...this.clients.entries()]));
          return;
        }
      }

      if (url.pathname === '/admin/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          production: {
            database: true,
            storage: true,
            worker: true
          }
        }));
        return;
      }
    }

    // Client endpoints
    if (!clientId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Client ID required' }));
      return;
    }

    if (req.method === 'GET') {
      const data = this.clients.get(clientId) || null;
      res.writeHead(200);
      res.end(JSON.stringify({ data }));
    } else if (req.method === 'POST') {
      try {
        const data = JSON.parse(chunks.toString());
        this.clients.set(clientId, data);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    } else if (req.method === 'DELETE') {
      this.clients.delete(clientId);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }
}

module.exports = { MockWorkerServer };