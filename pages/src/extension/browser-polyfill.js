/* global safari */
// Browser API compatibility layer
const browserAPI = (() => {
  if (typeof browser !== 'undefined') {
    // Firefox already has the browser namespace
    return browser;
  } else if (typeof chrome !== 'undefined') {
    // Chrome uses the chrome namespace
    return {
      storage: {
        local: {
          get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
          set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve))
        }
      },
      history: {
        search: (query) => new Promise((resolve) => chrome.history.search(query, resolve)),
        addUrl: (details) => new Promise((resolve) => chrome.history.addUrl(details, resolve)),
        onVisited: {
          addListener: (callback) => chrome.history.onVisited.addListener(callback)
        }
      },
      tabs: {
        create: (details) => new Promise((resolve) => chrome.tabs.create(details, resolve))
      }
    };
  } else if (typeof safari !== 'undefined') {
    // Safari extension API
    return {
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
  } else {
    throw new Error('No compatible browser API found');
  }
})();

// Export for use in other files
export default browserAPI;