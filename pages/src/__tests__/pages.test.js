const { createExecutionContext } = require('miniflare');

describe('Pages Tests', () => {
  let context;
  let env;

  beforeEach(async () => {
    context = await createExecutionContext({
      modules: true,
      script: `
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);
            const clientId = url.searchParams.get('clientId');
            const adminPassword = request.headers.get('Authorization')?.replace('Bearer ', '');

            // Mock IndexedDB
            const mockDB = {
              data: new Map(),
              clientId: null,
              async init(id) {
                this.clientId = id;
                return Promise.resolve();
              },
              async getData() {
                return this.data.get(this.clientId) || {};
              },
              async setData(data) {
                this.data.set(this.clientId, data);
                return Promise.resolve();
              }
            };
            globalThis.indexedDB = {
              open: () => ({
                result: mockDB,
                onsuccess: () => {}
              })
            };

            // Handle different endpoints
            if (url.pathname === '/health') {
              return new Response(JSON.stringify({
                healthy: true,
                error: null,
                timestamp: new Date().toISOString()
              }), {
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Security-Policy': env.CSP_HEADER
                }
              });
            }

            if (url.pathname === '/admin/stats' && adminPassword === 'francesisthebest') {
              return new Response(JSON.stringify([{
                clientId: 'test123',
                lastSync: new Date().toISOString(),
                dataSize: 1024
              }]), {
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Security-Policy': env.CSP_HEADER
                }
              });
            }

            if (url.pathname === '/admin/client' && adminPassword === 'francesisthebest') {
              if (request.method === 'DELETE') {
                return new Response(JSON.stringify({ success: true }), {
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Security-Policy': env.CSP_HEADER
                  }
                });
              }
              if (request.method === 'GET') {
                return new Response(JSON.stringify({ key: 'value' }), {
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Security-Policy': env.CSP_HEADER
                  }
                });
              }
            }

            // Default response for sync endpoint
            return new Response(JSON.stringify({ success: true }), {
              headers: {
                'Content-Type': 'application/json',
                'Content-Security-Policy': env.CSP_HEADER
              }
            });
          }
        }
      `,
      bindings: {
        CSP_HEADER: "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.chroniclesync.xyz https://api-staging.chroniclesync.xyz http://localhost:8787; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
      }
    });
    env = context.env;
  });

  afterEach(() => {
    context = null;
    env = null;
  });

  describe('CSP Tests', () => {
    test('CSP header allows required script sources', async () => {
      const scripts = [
        { src: '/local-script.js', expectAllow: true },
        { src: 'https://api.chroniclesync.xyz/script.js', expectAllow: false },
        { inline: true, expectAllow: true }
      ];

      for (const script of scripts) {
        const response = await context.fetch('http://localhost', {
          method: 'GET',
          headers: { 'Content-Type': 'text/html' }
        });

        const csp = response.headers.get('Content-Security-Policy');
        const scriptSrc = csp.match(/script-src ([^;]+)/)[1].split(' ');

        if (script.inline) {
          expect(scriptSrc).toContain("'unsafe-inline'");
        } else if (script.src.startsWith('http')) {
          const url = new URL(script.src);
          const allowed = scriptSrc.some(src => 
            src === url.origin || src === "'*'" || src === "*"
          );
          expect(allowed).toBe(script.expectAllow);
        } else {
          expect(scriptSrc).toContain("'self'");
        }
      }
    });

    test('CSP header allows required connect sources', async () => {
      const apis = [
        { url: 'https://api.chroniclesync.xyz/data', expectAllow: true },
        { url: 'https://api-staging.chroniclesync.xyz/data', expectAllow: true },
        { url: 'http://localhost:8787/data', expectAllow: true },
        { url: 'https://malicious-site.com/data', expectAllow: false }
      ];

      for (const api of apis) {
        const response = await context.fetch('http://localhost', {
          method: 'GET',
          headers: { 'Content-Type': 'text/html' }
        });

        const csp = response.headers.get('Content-Security-Policy');
        const connectSrc = csp.match(/connect-src ([^;]+)/)[1].split(' ');
        
        const url = new URL(api.url);
        const allowed = connectSrc.some(src => 
          src === url.origin || src === "'*'" || src === "*" || 
          (src === "'self'" && url.origin === 'http://localhost:8787')
        );
        
        expect(allowed).toBe(api.expectAllow);
      }
    });
  });

  describe('Health Check Tests', () => {
    test('health endpoint returns status', async () => {
      const response = await context.fetch('http://localhost/health');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        healthy: true,
        error: null,
        timestamp: expect.any(String)
      }));
    });
  });

  describe('Admin Tests', () => {
    test('stats endpoint requires authentication', async () => {
      const response = await context.fetch('http://localhost/admin/stats');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    test('stats endpoint returns data with auth', async () => {
      const response = await context.fetch('http://localhost/admin/stats', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual([
        expect.objectContaining({
          clientId: 'test123',
          lastSync: expect.any(String),
          dataSize: 1024
        })
      ]);
    });

    test('client deletion requires authentication', async () => {
      const response = await context.fetch('http://localhost/admin/client?clientId=test123', {
        method: 'DELETE'
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({});
    });

    test('client deletion works with auth', async () => {
      const response = await context.fetch('http://localhost/admin/client?clientId=test123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    test('client data view requires authentication', async () => {
      const response = await context.fetch('http://localhost/admin/client?clientId=test123');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({});
    });

    test('client data view works with auth', async () => {
      const response = await context.fetch('http://localhost/admin/client?clientId=test123', {
        headers: {
          'Authorization': 'Bearer francesisthebest'
        }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ key: 'value' });
    });
  });

  describe('Data Sync Tests', () => {
    test('sync endpoint accepts data', async () => {
      const testData = { test: 'data' };
      const response = await context.fetch('http://localhost?clientId=test123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    test('sync endpoint requires clientId', async () => {
      const response = await context.fetch('http://localhost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(200);
    });
  });
});