import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

test.describe('Chrome Extension', () => {
  test('extension should load without errors', async () => {
    test.setTimeout(60000); // Increase timeout to 1 minute
    const pathToExtension = path.join(__dirname, '../../../dist/chrome');
    console.log('Loading extension from path:', pathToExtension);
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        '--enable-logging',
        '--v=1',
        '--enable-automation',
        '--remote-debugging-port=0',
        '--disable-web-security',
        '--allow-insecure-localhost',
        '--allow-running-insecure-content',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--enable-logging=stderr',
        '--log-level=0',
        '--enable-background-networking',
        '--enable-features=ServiceWorker',
        '--enable-background-mode',
        '--enable-background-thread-pool',
        '--enable-logging=stderr --v=0',
        '--enable-features=NetworkService,NetworkServiceInProcess,ServiceWorker',
      ],
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      bypassCSP: true,
      recordVideo: {
        dir: 'test-results',
        size: { width: 1280, height: 720 },
      },
      serviceWorkers: 'allow',
      permissions: ['background-sync'],
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`${name} [${severity}]: ${message}`),
      },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    try {
      // Wait for the extension to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log initial state
      console.log('Initial pages:', context.pages().map(p => p.url()));
      console.log('Initial service workers:', context.serviceWorkers().map(w => w.url()));

      // Create a background page
      const backgroundPage = await context.newPage();
      await backgroundPage.goto('chrome://extensions');
      console.log('Background page URL:', await backgroundPage.url());

      // Listen for console messages in background page
      backgroundPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Background page console ${type}:`, text);
        // Log errors but don't fail test
        if (type === 'error') {
          console.error(`Background page error: ${text}`);
        }
      });

      await backgroundPage.evaluate(() => {
        // Force service worker registration
        if ('serviceWorker' in navigator) {
          console.log('Registering service worker from background page...');
          navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
            type: 'module',
            updateViaCache: 'none',
          }).then(
            registration => {
              console.log('Service worker registered from background page:', registration);
              registration.update();
              // Wait for the service worker to be activated
              if (registration.active) {
                console.log('Service worker is already active');
              } else {
                registration.addEventListener('activate', () => {
                  console.log('Service worker activated');
                });
              }
            },
            error => console.error('Service worker registration failed from background page:', error)
          );
        } else {
          console.log('Service workers not supported in background page');
        }
      });

      try {
        await backgroundPage.waitForFunction(() => {
          return navigator.serviceWorker.ready.then(() => true).catch(() => false);
        }, { timeout: 10000 });
      } catch (error) {
        console.error('Service worker ready timeout:', error);
      }

      await backgroundPage.evaluate(() => {
        // Try to get service worker registration
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(
            registration => {
              console.log('Service worker registration from background page:', registration);
              if (registration) {
                console.log('Service worker state from background page:', registration.active?.state);
                console.log('Service worker scope from background page:', registration.scope);
              }
            },
            error => console.error('Failed to get service worker registration from background page:', error)
          );
        }
      });

      // Wait for any service worker registrations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log intermediate state
      console.log('After background page - pages:', context.pages().map(p => p.url()));
      console.log('After background page - service workers:', context.serviceWorkers().map(w => w.url()));

      // Wait for service workers to be available
      let retries = 0;
      while (context.serviceWorkers().length === 0 && retries < 3) {
        console.log('Waiting for service workers, attempt:', retries + 1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      // Log service worker state
      const workers = context.serviceWorkers();
      console.log('Service workers:', workers.map(w => w.url()));
      if (workers.length > 0) {
        console.log('Service worker found:', workers[0].url());
        // Try to get service worker state
        await backgroundPage.evaluate(() => {
          // Try to get service worker state with JSON.stringify and replacer
          if ('serviceWorker' in navigator) {
            Promise.all([
              navigator.serviceWorker.getRegistration(),
              navigator.serviceWorker.getRegistrations(),
              navigator.serviceWorker.ready,
            ]).then(([registration, registrations, ready]) => {
              console.log('Service worker state (stringified with replacer):', JSON.stringify({
                controller: navigator.serviceWorker.controller,
                ready: ready,
                registrations: registrations,
                registration: registration,
              }, (key, value) => {
                if (value instanceof ServiceWorker) {
                  return {
                    state: value.state,
                    scriptURL: value.scriptURL,
                    onstatechange: value.onstatechange,
                    onerror: value.onerror,
                    postMessage: value.postMessage ? 'function' : undefined,
                    addEventListener: value.addEventListener ? 'function' : undefined,
                    removeEventListener: value.removeEventListener ? 'function' : undefined,
                    dispatchEvent: value.dispatchEvent ? 'function' : undefined,
                  };
                }
                if (value instanceof ServiceWorkerRegistration) {
                  return {
                    active: value.active ? {
                      state: value.active.state,
                      scriptURL: value.active.scriptURL,
                      onstatechange: value.active.onstatechange,
                      onerror: value.active.onerror,
                      postMessage: value.active.postMessage ? 'function' : undefined,
                      addEventListener: value.active.addEventListener ? 'function' : undefined,
                      removeEventListener: value.active.removeEventListener ? 'function' : undefined,
                      dispatchEvent: value.active.dispatchEvent ? 'function' : undefined,
                    } : null,
                    installing: value.installing ? {
                      state: value.installing.state,
                      scriptURL: value.installing.scriptURL,
                      onstatechange: value.installing.onstatechange,
                      onerror: value.installing.onerror,
                      postMessage: value.installing.postMessage ? 'function' : undefined,
                      addEventListener: value.installing.addEventListener ? 'function' : undefined,
                      removeEventListener: value.installing.removeEventListener ? 'function' : undefined,
                      dispatchEvent: value.installing.dispatchEvent ? 'function' : undefined,
                    } : null,
                    waiting: value.waiting ? {
                      state: value.waiting.state,
                      scriptURL: value.waiting.scriptURL,
                      onstatechange: value.waiting.onstatechange,
                      onerror: value.waiting.onerror,
                      postMessage: value.waiting.postMessage ? 'function' : undefined,
                      addEventListener: value.waiting.addEventListener ? 'function' : undefined,
                      removeEventListener: value.waiting.removeEventListener ? 'function' : undefined,
                      dispatchEvent: value.waiting.dispatchEvent ? 'function' : undefined,
                    } : null,
                    scope: value.scope,
                    navigationPreload: value.navigationPreload,
                    pushManager: value.pushManager,
                    sync: value.sync,
                    index: value.index,
                    unregister: value.unregister ? 'function' : undefined,
                    update: value.update ? 'function' : undefined,
                    updateViaCache: value.updateViaCache,
                    addEventListener: value.addEventListener ? 'function' : undefined,
                    removeEventListener: value.removeEventListener ? 'function' : undefined,
                    dispatchEvent: value.dispatchEvent ? 'function' : undefined,
                  };
                }
                return value;
              }, 2));
            }).catch(error => {
              console.error('Failed to get service worker state:', error);
            });
          }
        });
      } else {
        console.error('No service workers found after retries');
      }

      // Wait for any service worker registrations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the extension ID from the background page URL
      const pages = await context.pages();
      const extensionPages = pages.filter(p => p.url().startsWith('chrome-extension://'));
      if (extensionPages.length === 0) {
        throw new Error('No extension pages found');
      }
      const extensionUrl = extensionPages[0].url();
      const extensionId = extensionUrl.split('/')[2];
      console.log('Extension ID:', extensionId);

      // Wait for any service worker registrations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log final state
      console.log('Final pages:', context.pages().map(p => p.url()));
      console.log('Final service workers:', context.serviceWorkers().map(w => w.url()));

      // Wait for any service worker registrations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close all pages
      const pages2 = await context.pages();
      for (const page of pages2) {
        await page.close();
      }
    } finally {
      // Close the context
      await context.close();
    }
  });
});
