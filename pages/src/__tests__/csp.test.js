const { createExecutionContext } = require('miniflare');

describe('Content Security Policy Tests', () => {
  let context;
  let env;

  beforeEach(async () => {
    context = await createExecutionContext({
      modules: true,
      script: `
        export default {
          fetch(request, env, ctx) {
            return new Response('Test Response', {
              headers: {
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

  test('CSP header allows required script sources', async () => {
    const scripts = [
      { src: '/local-script.js', expectAllow: true },
      { src: 'https://api.chroniclesync.xyz/script.js', expectAllow: false },
      { inline: true, expectAllow: true }
    ];

    for (const script of scripts) {
      const html = script.inline 
        ? '<script>console.log("test")</script>'
        : `<script src="${script.src}"></script>`;

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

  test('CSP header allows required style sources', async () => {
    const styles = [
      { src: '/local-style.css', expectAllow: true },
      { inline: true, expectAllow: true },
      { src: 'https://external-cdn.com/style.css', expectAllow: false }
    ];

    for (const style of styles) {
      const html = style.inline
        ? '<style>body { color: red; }</style>'
        : `<link rel="stylesheet" href="${style.src}">`;

      const response = await context.fetch('http://localhost', {
        method: 'GET',
        headers: { 'Content-Type': 'text/html' }
      });

      const csp = response.headers.get('Content-Security-Policy');
      const styleSrc = csp.match(/style-src ([^;]+)/)[1].split(' ');

      if (style.inline) {
        expect(styleSrc).toContain("'unsafe-inline'");
      } else if (style.src.startsWith('http')) {
        const url = new URL(style.src);
        const allowed = styleSrc.some(src => 
          src === url.origin || src === "'*'" || src === "*"
        );
        expect(allowed).toBe(style.expectAllow);
      } else {
        expect(styleSrc).toContain("'self'");
      }
    }
  });

  test('CSP header allows required font sources', async () => {
    const fonts = [
      { src: '/local-font.woff2', expectAllow: true },
      { src: 'data:application/font-woff2;base64,...', expectAllow: true }
    ];

    for (const font of fonts) {
      const response = await context.fetch('http://localhost', {
        method: 'GET',
        headers: { 'Content-Type': 'text/html' }
      });

      const csp = response.headers.get('Content-Security-Policy');
      const fontSrc = csp.match(/font-src ([^;]+)/)[1].split(' ');

      if (font.src.startsWith('data:')) {
        expect(fontSrc).toContain('data:');
      } else {
        expect(fontSrc).toContain("'self'");
      }
    }
  });
});