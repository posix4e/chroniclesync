/**
 * Safari Extension Compatibility Layer for Chrome Extensions
 * 
 * This script provides a compatibility layer that maps Chrome extension APIs
 * to Safari extension APIs, allowing Chrome extensions to run in Safari with
 * minimal modifications.
 */

(function() {
  'use strict';

  // Check if we're running in Safari
  const isSafari = typeof browser === 'undefined' || Object.getPrototypeOf(browser) !== Object.prototype;
  
  // If we're not in Safari or the polyfill is already applied, exit
  if (!isSafari || window.browser) {
    return;
  }

  // Create the browser namespace
  window.browser = {
    // Storage API
    storage: {
      local: {
        get: function(keys, callback) {
          const result = {};
          
          if (typeof keys === 'string') {
            keys = [keys];
          }
          
          if (Array.isArray(keys)) {
            keys.forEach(key => {
              result[key] = safari.extension.settings[key];
            });
          } else if (keys === null) {
            // Get all keys
            Object.keys(safari.extension.settings).forEach(key => {
              result[key] = safari.extension.settings[key];
            });
          } else {
            // keys is an object
            Object.keys(keys).forEach(key => {
              result[key] = safari.extension.settings[key] || keys[key];
            });
          }
          
          if (callback) {
            callback(result);
          }
          
          return Promise.resolve(result);
        },
        
        set: function(items, callback) {
          Object.keys(items).forEach(key => {
            safari.extension.settings[key] = items[key];
          });
          
          if (callback) {
            callback();
          }
          
          return Promise.resolve();
        },
        
        remove: function(keys, callback) {
          if (typeof keys === 'string') {
            keys = [keys];
          }
          
          keys.forEach(key => {
            delete safari.extension.settings[key];
          });
          
          if (callback) {
            callback();
          }
          
          return Promise.resolve();
        },
        
        clear: function(callback) {
          Object.keys(safari.extension.settings).forEach(key => {
            delete safari.extension.settings[key];
          });
          
          if (callback) {
            callback();
          }
          
          return Promise.resolve();
        }
      },
      
      // Sync storage (maps to local in Safari)
      sync: {
        get: function(keys, callback) {
          return browser.storage.local.get(keys, callback);
        },
        
        set: function(items, callback) {
          return browser.storage.local.set(items, callback);
        },
        
        remove: function(keys, callback) {
          return browser.storage.local.remove(keys, callback);
        },
        
        clear: function(callback) {
          return browser.storage.local.clear(callback);
        }
      }
    },
    
    // Tabs API
    tabs: {
      query: function(queryInfo, callback) {
        // In Safari, we can only get the active tab in the current window
        const tabs = [];
        
        if (queryInfo.active && queryInfo.currentWindow) {
          tabs.push({
            id: 0,
            url: window.location.href,
            title: document.title,
            active: true,
            windowId: 0
          });
        }
        
        if (callback) {
          callback(tabs);
        }
        
        return Promise.resolve(tabs);
      },
      
      create: function(createProperties, callback) {
        const tab = {
          id: Math.floor(Math.random() * 100000),
          url: createProperties.url,
          active: createProperties.active || true,
          windowId: 0
        };
        
        // Open the URL in a new tab
        window.open(createProperties.url, '_blank');
        
        if (callback) {
          callback(tab);
        }
        
        return Promise.resolve(tab);
      },
      
      update: function(tabId, updateProperties, callback) {
        // In Safari, we can only update the current tab
        if (updateProperties.url) {
          window.location.href = updateProperties.url;
        }
        
        const tab = {
          id: tabId || 0,
          url: updateProperties.url || window.location.href,
          active: true,
          windowId: 0
        };
        
        if (callback) {
          callback(tab);
        }
        
        return Promise.resolve(tab);
      }
    },
    
    // Runtime API
    runtime: {
      sendMessage: function(message, callback) {
        // Send message to background script
        safari.extension.dispatchMessage('sendMessage', message);
        
        if (callback) {
          // We can't get a response in Safari, so we call the callback with null
          callback(null);
        }
        
        return Promise.resolve(null);
      },
      
      onMessage: {
        addListener: function(listener) {
          // Listen for messages from background script
          safari.self.addEventListener('message', function(event) {
            if (event.name === 'message') {
              listener(event.message, { tab: { id: 0 } }, function() {});
            }
          });
        }
      }
    },
    
    // History API (limited functionality in Safari)
    history: {
      search: function(query, callback) {
        // Safari doesn't provide access to browsing history
        // Return an empty array
        const historyItems = [];
        
        if (callback) {
          callback(historyItems);
        }
        
        return Promise.resolve(historyItems);
      },
      
      addUrl: function(details, callback) {
        // Safari doesn't allow adding to history
        if (callback) {
          callback();
        }
        
        return Promise.resolve();
      }
    }
  };
})();