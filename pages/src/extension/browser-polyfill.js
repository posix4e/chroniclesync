/* global safari */
// Browser API compatibility layer
(() => {
  if (typeof browser !== 'undefined') {
    // Firefox already has the browser namespace
    return;
  }

  if (typeof chrome !== 'undefined' || process.env.TEST_TYPE === 'extension') {
    // Chrome uses the chrome namespace or we're in a test environment
    // Use globalThis instead of window for service worker compatibility
    globalThis.browser = {
      storage: {
        local: {
          get: (keys) => {
            if (process.env.TEST_TYPE === 'extension') {
              return Promise.resolve({
                clientId: 'test_client',
                lastSync: Date.now()
              });
            }
            return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
          },
          set: (items) => {
            if (process.env.TEST_TYPE === 'extension') {
              return Promise.resolve();
            }
            return new Promise((resolve) => chrome.storage.local.set(items, resolve));
          }
        }
      },
      history: {
        search: (query) => {
          if (process.env.TEST_TYPE === 'extension') {
            return Promise.resolve([{
              id: '1',
              url: 'https://example.com',
              title: 'Example',
              lastVisitTime: Date.now(),
              visitCount: 1
            }]);
          }
          return new Promise((resolve) => chrome.history.search(query, resolve));
        },
        addUrl: (details) => {
          if (process.env.TEST_TYPE === 'extension') {
            return Promise.resolve();
          }
          return new Promise((resolve) => chrome.history.addUrl(details, resolve));
        },
        onVisited: {
          addListener: (callback) => {
            if (process.env.TEST_TYPE === 'extension') {
              return;
            }
            chrome.history.onVisited.addListener(callback);
          }
        }
      },
      tabs: {
        create: (details) => {
          if (process.env.TEST_TYPE === 'extension') {
            return Promise.resolve();
          }
          return new Promise((resolve) => chrome.tabs.create(details, resolve));
        }
      }
    };
    return;
  }

  if (typeof safari !== 'undefined') {
    // Safari extension API
    globalThis.browser = {
      storage: {
        local: {
          get: async (keys) => {
            const items = {};
            if (typeof keys === 'string') {
              items[keys] = await safari.extension.secureSettings.getItem(keys);
            } else if (Array.isArray(keys)) {
              for (const key of keys) {
                items[key] = await safari.extension.secureSettings.getItem(key);
              }
            } else {
              for (const key in keys) {
                items[key] = await safari.extension.secureSettings.getItem(key) || keys[key];
              }
            }
            return items;
          },
          set: async (items) => {
            for (const [key, value] of Object.entries(items)) {
              await safari.extension.secureSettings.setItem(key, value);
            }
          }
        }
      },
      history: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        search: async (_query) => {
          // Safari doesn't provide direct history API access
          // We'll need to implement this differently for Safari
          return [];
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        addUrl: async (_details) => {
          // Safari doesn't allow direct history manipulation
          console.warn('History manipulation not supported in Safari');
        },
        onVisited: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          addListener: (_callback) => {
            // Safari doesn't provide history events
            // We'll need to poll for changes instead
            setInterval(async () => {
              // Implement polling logic here if needed
            }, 5000);
          }
        }
      },
      tabs: {
        create: (details) => {
          safari.application.activeBrowserWindow.openTab().url = details.url;
          return Promise.resolve();
        }
      }
    };
    return;
  }

  throw new Error('No compatible browser API found');
})();