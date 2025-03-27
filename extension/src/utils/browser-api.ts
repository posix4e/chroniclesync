/**
 * Browser API abstraction layer
 * 
 * This module provides a unified interface for browser extension APIs,
 * abstracting away the differences between Chrome, Firefox, and Safari.
 */

import { BrowserType, detectBrowser, isSafari } from './platform';

/**
 * Storage API abstraction
 */
export const storage = {
  /**
   * Get items from storage
   */
  async get(keys: string | string[] | null): Promise<Record<string, any>> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        const result: Record<string, any> = {};
        if (keys === null) {
          // Get all items
          for (let i = 0; i < safari.extension.settings.length; i++) {
            const key = safari.extension.settings.key(i);
            result[key] = safari.extension.settings.getItem(key);
          }
          resolve(result);
        } else {
          // Get specific items
          const keyArray = typeof keys === 'string' ? [keys] : keys;
          keyArray.forEach(key => {
            result[key] = safari.extension.settings.getItem(key);
          });
          resolve(result);
        }
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items) => {
          resolve(items);
        });
      });
    }
  },

  /**
   * Set items in storage
   */
  async set(items: Record<string, any>): Promise<void> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        Object.entries(items).forEach(([key, value]) => {
          safari.extension.settings.setItem(key, value);
        });
        resolve();
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
          resolve();
        });
      });
    }
  },

  /**
   * Remove items from storage
   */
  async remove(keys: string | string[]): Promise<void> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        keyArray.forEach(key => {
          safari.extension.settings.removeItem(key);
        });
        resolve();
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.storage.local.remove(keys, () => {
          resolve();
        });
      });
    }
  },

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        for (let i = 0; i < safari.extension.settings.length; i++) {
          const key = safari.extension.settings.key(i);
          safari.extension.settings.removeItem(key);
        }
        resolve();
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    }
  }
};

/**
 * Tabs API abstraction
 */
export const tabs = {
  /**
   * Get the current active tab
   */
  async getActive(): Promise<any> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        const activeTab = safari.application.activeBrowserWindow.activeTab;
        resolve({
          id: activeTab.id,
          url: activeTab.url,
          title: activeTab.title
        });
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs[0]);
        });
      });
    }
  },

  /**
   * Create a new tab
   */
  async create(options: { url: string }): Promise<any> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        const newTab = safari.application.activeBrowserWindow.openTab();
        newTab.url = options.url;
        resolve({
          id: newTab.id,
          url: newTab.url
        });
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.tabs.create(options, (tab) => {
          resolve(tab);
        });
      });
    }
  },

  /**
   * Send a message to a tab
   */
  async sendMessage(tabId: number, message: any): Promise<any> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        // Find the tab by ID
        const allWindows = safari.application.browserWindows;
        let targetTab = null;
        
        for (let i = 0; i < allWindows.length; i++) {
          const tabs = allWindows[i].tabs;
          for (let j = 0; j < tabs.length; j++) {
            if (tabs[j].id === tabId) {
              targetTab = tabs[j];
              break;
            }
          }
          if (targetTab) break;
        }
        
        if (targetTab) {
          // Safari doesn't have a direct equivalent to chrome.tabs.sendMessage
          // We use a workaround with dispatchMessage
          targetTab.page.dispatchMessage('fromExtension', message);
          
          // Set up a one-time listener for the response
          const responseHandler = (event: any) => {
            if (event.name === 'fromPage' && event.target === targetTab.page) {
              safari.self.removeEventListener('message', responseHandler);
              resolve(event.message);
            }
          };
          
          safari.self.addEventListener('message', responseHandler);
        } else {
          resolve(null);
        }
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          resolve(response);
        });
      });
    }
  }
};

/**
 * Runtime API abstraction
 */
export const runtime = {
  /**
   * Send a message to the extension background script
   */
  async sendMessage(message: any): Promise<any> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      return new Promise((resolve) => {
        // Safari doesn't have a direct equivalent to chrome.runtime.sendMessage
        // We use a workaround with dispatchMessage
        safari.extension.dispatchMessage('fromPage', message);
        
        // Set up a one-time listener for the response
        const responseHandler = (event: any) => {
          if (event.name === 'fromBackground') {
            safari.self.removeEventListener('message', responseHandler);
            resolve(event.message);
          }
        };
        
        safari.self.addEventListener('message', responseHandler);
      });
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response);
        });
      });
    }
  },

  /**
   * Add a listener for messages from content scripts or popup
   */
  onMessage: {
    addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void): void {
      const browserType = detectBrowser();
      
      if (browserType === BrowserType.Safari) {
        safari.application.addEventListener('message', (event) => {
          if (event.name === 'fromPage') {
            const sender = {
              tab: {
                id: event.target.id,
                url: event.target.url
              }
            };
            
            const sendResponse = (response: any) => {
              event.target.page.dispatchMessage('fromBackground', response);
            };
            
            callback(event.message, sender, sendResponse);
          }
        });
      } else {
        // Chrome or Firefox
        chrome.runtime.onMessage.addListener(callback);
      }
    }
  }
};

/**
 * History API abstraction
 */
export const history = {
  /**
   * Search browser history
   */
  async search(query: { text: string, maxResults?: number, startTime?: number, endTime?: number }): Promise<any[]> {
    const browserType = detectBrowser();
    
    if (browserType === BrowserType.Safari) {
      // Safari doesn't provide direct access to browser history through extensions
      // We'll need to use a workaround or store history in our own database
      return Promise.resolve([]);
    } else {
      // Chrome or Firefox
      return new Promise((resolve) => {
        chrome.history.search(query, (results) => {
          resolve(results);
        });
      });
    }
  }
};

/**
 * Unified browser API
 */
export const browserAPI = {
  storage,
  tabs,
  runtime,
  history,
  
  /**
   * Get the browser type
   */
  getBrowserType(): BrowserType {
    return detectBrowser();
  }
};