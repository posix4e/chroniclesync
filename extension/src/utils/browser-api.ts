/**
 * Browser API compatibility layer
 * 
 * This module provides a unified API for browser extension functionality
 * across different browsers (Chrome, Firefox, Safari).
 */

// Define Firefox browser type for TypeScript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const browser: {
  runtime: {
    getBrowserInfo: () => Promise<{ name: string; version: string }>;
    sendMessage: <T>(message: unknown) => Promise<T>;
    getURL: (path: string) => string;
    id: string;
  };
  storage: {
    local: {
      get: <T>(keys: string | string[] | null) => Promise<T>;
      set: (items: Record<string, unknown>) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
  tabs: {
    create: (options: chrome.tabs.CreateProperties) => Promise<chrome.tabs.Tab>;
    query: (queryInfo: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab[]>;
    update: (tabId: number | undefined, updateProperties: chrome.tabs.UpdateProperties) => Promise<chrome.tabs.Tab | undefined>;
  };
};

// Detect browser type
export const browserType = (): 'chrome' | 'firefox' | 'safari' | 'unknown' => {
  if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function') {
    // Check for Firefox-specific properties
    if (typeof window !== 'undefined' && 'browser' in window) {
      const browserWindow = window as { browser?: Record<string, unknown> };
      if (browserWindow.browser && typeof browserWindow.browser === 'object') {
        const browserObj = browserWindow.browser;
        if ('runtime' in browserObj && typeof browserObj.runtime === 'object') {
          const runtimeObj = browserObj.runtime as Record<string, unknown>;
          if ('getBrowserInfo' in runtimeObj && typeof runtimeObj.getBrowserInfo === 'function') {
            return 'firefox';
          }
        }
      }
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

// Type for Firefox browser in window
type FirefoxBrowserWindow = {
  browser: {
    runtime: {
      getBrowserInfo: () => Promise<{ name: string; version: string }>;
      sendMessage: <T>(message: unknown) => Promise<T>;
      getURL: (path: string) => string;
      id: string;
    };
    storage: {
      local: {
        get: <T>(keys: string | string[] | null) => Promise<T>;
        set: (items: Record<string, unknown>) => Promise<void>;
        remove: (keys: string | string[]) => Promise<void>;
        clear: () => Promise<void>;
      };
    };
    tabs: {
      create: (options: chrome.tabs.CreateProperties) => Promise<chrome.tabs.Tab>;
      query: (queryInfo: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab[]>;
      update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties) => Promise<chrome.tabs.Tab | undefined>;
    };
  };
};

// Unified runtime API
export const runtime = {
  /**
   * Get browser information
   */
  getBrowserInfo: async (): Promise<{ name: string; version: string }> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      try {
        const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
        const info = await firefoxBrowser.runtime.getBrowserInfo();
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
  sendMessage: async <T = unknown>(message: unknown): Promise<T> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.runtime.sendMessage(message);
    }
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as T);
        }
      });
    });
  },
  
  /**
   * Get the extension URL
   */
  getURL: (path: string): string => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.runtime.getURL(path);
    }
    
    return chrome.runtime.getURL(path);
  },
  
  /**
   * Get the extension ID
   */
  getExtensionId: (): string => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.runtime.id;
    }
    
    return chrome.runtime.id;
  },
};

// Unified storage API
export const storage = {
  /**
   * Get items from storage
   */
  get: async <T = unknown>(keys: string | string[] | null): Promise<T> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.storage.local.get(keys);
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
  set: async (items: Record<string, unknown>): Promise<void> => {
    const type = browserType();
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.storage.local.set(items);
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
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.storage.local.remove(keys);
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
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.storage.local.clear();
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
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.tabs.create(options);
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
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      return firefoxBrowser.tabs.query(queryInfo);
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
    
    if (type === 'firefox' && typeof window !== 'undefined' && 'browser' in window) {
      const firefoxBrowser = (window as FirefoxBrowserWindow).browser;
      if (tabId !== undefined) {
        return firefoxBrowser.tabs.update(tabId, updateProperties);
      }
      return undefined;
    }
    
    return new Promise((resolve, reject) => {
      if (tabId === undefined) {
        resolve(undefined);
        return;
      }
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