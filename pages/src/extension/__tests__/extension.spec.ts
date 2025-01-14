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
            console.log('Service worker state from background page (stringified with replacer):', JSON.stringify({
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
                };
              }
              if (value instanceof ServiceWorkerRegistration) {
                return {
                  active: value.active ? {
                    state: value.active.state,
                    scriptURL: value.active.scriptURL,
                    onstatechange: value.active.onstatechange,
                    onerror: value.active.onerror,
                  } : null,
                  installing: value.installing ? {
                    state: value.installing.state,
                    scriptURL: value.installing.scriptURL,
                    onstatechange: value.installing.onstatechange,
                    onerror: value.installing.onerror,
                  } : null,
                  waiting: value.waiting ? {
                    state: value.waiting.state,
                    scriptURL: value.waiting.scriptURL,
                    onstatechange: value.waiting.onstatechange,
                    onerror: value.waiting.onerror,
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

    // Navigate to the extension popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    console.log('Popup page URL:', await popupPage.url());

    await backgroundPage.close();
    
    // Create a new page to trigger service worker registration
    const page = await context.newPage();
    await page.goto('about:blank');
    console.log('Test page URL:', await page.url());

    // Listen for console messages in test page
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`Test page console ${type}:`, text);
      // Log errors but don't fail test
      if (type === 'error') {
        console.error(`Test page error: ${text}`);
      }
    });

    await page.evaluate(() => {
      // Force service worker registration
      if ('serviceWorker' in navigator) {
        console.log('Registering service worker...');
        navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          type: 'module',
          updateViaCache: 'none',
        }).then(
          registration => {
            console.log('Service worker registered:', registration);
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
          error => console.error('Service worker registration failed:', error)
        );
      } else {
        console.log('Service workers not supported');
      }
    });

    try {
      await page.waitForFunction(() => {
        return navigator.serviceWorker.ready.then(() => true).catch(() => false);
      }, { timeout: 10000 });
    } catch (error) {
      console.error('Service worker ready timeout:', error);
    }

    await page.evaluate(() => {
      // Try to get service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(
          registration => {
            console.log('Service worker registration:', registration);
            if (registration) {
              console.log('Service worker state:', registration.active?.state);
              console.log('Service worker scope:', registration.scope);
            }
          },
          error => console.error('Failed to get service worker registration:', error)
        );
      }
    });

    await page.evaluate(() => {
      // Try to get all service worker registrations
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(
          registrations => {
            console.log('All service worker registrations:', registrations);
            registrations.forEach(registration => {
              console.log('Service worker state:', registration.active?.state);
              console.log('Service worker scope:', registration.scope);
            });
          },
          error => console.error('Failed to get service worker registrations:', error)
        );
      }
    });

    await page.evaluate(() => {
      // Try to get service worker controller
      if ('serviceWorker' in navigator) {
        const controller = navigator.serviceWorker.controller;
        console.log('Service worker controller:', controller);
        if (controller) {
          console.log('Service worker controller state:', controller.state);
          console.log('Service worker controller scriptURL:', controller.scriptURL);
        }
      }
    });

    await page.evaluate(() => {
      // Try to get service worker ready state
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(
          registration => {
            console.log('Service worker ready:', registration);
            if (registration) {
              console.log('Service worker ready state:', registration.active?.state);
              console.log('Service worker ready scope:', registration.scope);
            }
          },
          error => console.error('Failed to get service worker ready:', error)
        );
      }
    });

    await page.evaluate(() => {
      // Try to get service worker state
      if ('serviceWorker' in navigator) {
        console.log('Service worker state:', {
          controller: navigator.serviceWorker.controller,
          ready: navigator.serviceWorker.ready,
          registrations: navigator.serviceWorker.getRegistrations(),
          registration: navigator.serviceWorker.getRegistration(),
        });
      }
    });

    await page.evaluate(() => {
      // Try to get service worker state with JSON.stringify
      if ('serviceWorker' in navigator) {
        Promise.all([
          navigator.serviceWorker.getRegistration(),
          navigator.serviceWorker.getRegistrations(),
          navigator.serviceWorker.ready,
        ]).then(([registration, registrations, ready]) => {
          console.log('Service worker state (stringified):', JSON.stringify({
            controller: navigator.serviceWorker.controller,
            ready: ready,
            registrations: registrations,
            registration: registration,
          }, null, 2));
        }).catch(error => {
          console.error('Failed to get service worker state:', error);
        });
      }
    });

    // Wait for any service worker registrations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Log final state
    console.log('Final pages:', context.pages().map(p => p.url()));
    console.log('Final service workers:', context.serviceWorkers().map(w => w.url()));

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
      await page.evaluate(() => {
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
                };
              }
              if (value instanceof ServiceWorkerRegistration) {
                return {
                  active: value.active ? {
                    state: value.active.state,
                    scriptURL: value.active.scriptURL,
                    onstatechange: value.active.onstatechange,
                    onerror: value.active.onerror,
                  } : null,
                  installing: value.installing ? {
                    state: value.installing.state,
                    scriptURL: value.installing.scriptURL,
                    onstatechange: value.installing.onstatechange,
                    onerror: value.installing.onerror,
                  } : null,
                  waiting: value.waiting ? {
                    state: value.waiting.state,
                    scriptURL: value.waiting.scriptURL,
                    onstatechange: value.waiting.onstatechange,
                    onerror: value.waiting.onerror,
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

    await page.close();
    
    // Log the current state
    console.log('Current pages:', context.pages().map(p => p.url()));
    console.log('Current service workers:', context.serviceWorkers().map(w => w.url()));

    try {
      // Wait for the service worker to be available
      let extensionId: string | undefined;
      let retries = 0;
      while (!extensionId && retries < 3) {
        const workers = context.serviceWorkers();
        console.log('Service workers:', workers.map(w => w.url()));
        
        // Log worker URLs for debugging
        workers.forEach(worker => {
          console.log('Service worker URL:', worker.url());
        });
        
        // Try to get extension ID from service workers first
        extensionId = workers[0]?.url()?.split('/')[2];
        
        // If no service worker found, try to get extension ID from background page
        if (!extensionId) {
          const pages = context.pages();
          console.log('Pages:', pages.map(p => p.url()));
          const backgroundPage = pages.find(p => p.url().startsWith('chrome-extension://'));
          if (backgroundPage) {
            extensionId = backgroundPage.url().split('/')[2];
          }
        }
        
        if (!extensionId) {
          console.log('Waiting for service worker or background page, attempt:', retries + 1);
          console.log('Extension context:', {
            pages: context.pages().length,
            serviceWorkers: workers.length
          });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between retries
          retries++;
        }
      }
      
      if (!extensionId) {
        throw new Error('Could not find extension ID from background pages after retries');
      }
      
      expect(extensionId, 'Extension should have a valid ID').toBeTruthy();
      console.log('Extension loaded with ID:', extensionId);

      // We can't directly monitor service worker logs in Playwright
      // but we can check if the extension is working by accessing the popup

      // Navigate to the extension popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Listen for console messages in popup
      popupPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`Popup console ${type}:`, text);
        // Log errors but don't fail test
        if (type === 'error') {
          console.error(`Popup error: ${text}`);
        }
      });

      // Wait for React to mount and render
      await popupPage.waitForSelector('#root');
      
      // Ensure test-results directory exists
      const testResultsDir = path.join(__dirname, '../../../test-results');
      if (!existsSync(testResultsDir)) {
        mkdirSync(testResultsDir, { recursive: true });
      }

      // Take screenshot for debugging
      await popupPage.screenshot({ 
        path: path.join(testResultsDir, 'extension-popup.png'),
        fullPage: true 
      });

      // Verify basic popup structure
      const root = await popupPage.$('#root');
      expect(root, 'Root element should exist').toBeTruthy();

      // TODO: Add more specific UI checks once the popup interface is defined
      // For example:
      // await expect(page.getByRole('heading')).toBeVisible();
      // await expect(page.getByRole('button')).toBeEnabled();

    } finally {
      await context.close();
    }
  });
});