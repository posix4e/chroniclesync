/**
 * Browser API compatibility layer
 * 
 * This module provides a unified API for browser extension functionality
 * across different browsers (Chrome, Firefox, Safari).
 */

// Detect browser type
export const browserType = (): 'chrome' | 'firefox' | 'safari' | 'unknown' => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    // Check for Firefox-specific properties
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo) {
      return 'firefox';
    }
    
    // Check for Safari-specific properties
    if (navigator.vendor.includes('Apple')) {
      return 'safari';
    }
    
    // Default to Chrome
    return 'chrome';
  }
  
  return 'unknown';
};

// Unified runtime API
export const runtime = {
  /**
   * Get browser information
   */
  getBrowserInfo: async (): Promise<{ name: string; version: string }> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      try {
        const info = await browser.runtime.getBrowserInfo();
        return { name: info.name, version: info.version };
      } catch (error) {
        console.error('Error getting Firefox browser info:', error);
      }
    }
    
    // For Chrome and Safari, use navigator.userAgent
    const userAgent = navigator.userAgent;
    let name = 'Chrome';
    let version = '';
    
    if (type === 'safari') {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    } else {
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    
    return { name, version };
  },
  
  /**
   * Send a message to the background script/service worker
   */
  sendMessage: async <T = any>(message: any): Promise<T> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.runtime.sendMessage(message);
    }
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },
  
  /**
   * Get the extension URL
   */
  getURL: (path: string): string => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.runtime.getURL(path);
    }
    
    return chrome.runtime.getURL(path);
  },
  
  /**
   * Get the extension ID
   */
  getExtensionId: (): string => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.runtime.id;
    }
    
    return chrome.runtime.id;
  },
};

// Unified storage API
export const storage = {
  /**
   * Get items from storage
   */
  get: async <T = any>(keys: string | string[] | null): Promise<T> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.storage.local.get(keys);
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result as T);
        }
      });
    });
  },
  
  /**
   * Set items in storage
   */
  set: async (items: Record<string, any>): Promise<void> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.storage.local.set(items);
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
  
  /**
   * Remove items from storage
   */
  remove: async (keys: string | string[]): Promise<void> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.storage.local.remove(keys);
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
  
  /**
   * Clear all items from storage
   */
  clear: async (): Promise<void> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.storage.local.clear();
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
};

// Unified tabs API
export const tabs = {
  /**
   * Create a new tab
   */
  create: async (options: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.tabs.create(options);
    }
    
    return new Promise((resolve, reject) => {
      chrome.tabs.create(options, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tab);
        }
      });
    });
  },
  
  /**
   * Query tabs
   */
  query: async (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.tabs.query(queryInfo);
    }
    
    return new Promise((resolve, reject) => {
      chrome.tabs.query(queryInfo, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tabs);
        }
      });
    });
  },
  
  /**
   * Update a tab
   */
  update: async (
    tabId: number | undefined,
    updateProperties: chrome.tabs.UpdateProperties
  ): Promise<chrome.tabs.Tab | undefined> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof browser !== 'undefined') {
      return browser.tabs.update(tabId, updateProperties);
    }
    
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, updateProperties, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tab);
        }
      });
    });
  },
};

// Export a unified browser API
export default {
  runtime,
  storage,
  tabs,
  type: browserType,
};