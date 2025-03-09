/**
 * Browser API adapter to handle differences between Chrome, Firefox, and Safari
 */

// Detect browser type
export const getBrowserType = (): 'chrome' | 'firefox' | 'safari' | 'unknown' => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    // Check for Firefox-specific properties
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo) {
      return 'firefox';
    }
    return 'chrome';
  }
  
  // Safari detection
  if (typeof browser !== 'undefined' && browser.runtime && 
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return 'safari';
  }
  
  return 'unknown';
};

// Storage API adapter
export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          resolve(result[key] || null);
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different storage API
      if (typeof browser !== 'undefined' && browser.storage) {
        return browser.storage.local.get(key).then((result: any) => result[key] || null);
      }
      // Fallback to localStorage for Safari
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    
    return null;
  },
  
  set: async <T>(key: string, value: T): Promise<void> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different storage API
      if (typeof browser !== 'undefined' && browser.storage) {
        return browser.storage.local.set({ [key]: value });
      }
      // Fallback to localStorage for Safari
      localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    }
    
    return Promise.resolve();
  },
  
  remove: async (key: string): Promise<void> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, () => {
          resolve();
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different storage API
      if (typeof browser !== 'undefined' && browser.storage) {
        return browser.storage.local.remove(key);
      }
      // Fallback to localStorage for Safari
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    
    return Promise.resolve();
  }
};

// Tabs API adapter
export const tabs = {
  query: async (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.tabs.query(queryInfo, (tabs) => {
          resolve(tabs);
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different tabs API
      if (typeof browser !== 'undefined' && browser.tabs) {
        return browser.tabs.query(queryInfo);
      }
      return [];
    }
    
    return [];
  },
  
  create: async (createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.tabs.create(createProperties, (tab) => {
          resolve(tab);
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different tabs API
      if (typeof browser !== 'undefined' && browser.tabs) {
        return browser.tabs.create(createProperties);
      }
      throw new Error('Tabs API not supported in this browser');
    }
    
    throw new Error('Tabs API not supported in this browser');
  }
};

// Runtime API adapter
export const runtime = {
  sendMessage: async <T>(message: any): Promise<T> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response as T);
        });
      });
    } else if (browserType === 'safari') {
      // Safari uses a different runtime API
      if (typeof browser !== 'undefined' && browser.runtime) {
        return browser.runtime.sendMessage(message);
      }
      throw new Error('Runtime API not supported in this browser');
    }
    
    throw new Error('Runtime API not supported in this browser');
  }
};

// History API adapter
export const history = {
  search: async (query: chrome.history.HistoryQuery): Promise<chrome.history.HistoryItem[]> => {
    const browserType = getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'chrome') {
      return new Promise((resolve) => {
        chrome.history.search(query, (historyItems) => {
          resolve(historyItems);
        });
      });
    } else if (browserType === 'safari') {
      // Safari doesn't have direct history API access
      // We'll need to use a different approach for Safari
      if (typeof browser !== 'undefined' && browser.history) {
        return browser.history.search(query);
      }
      return [];
    }
    
    return [];
  }
};

// Export a unified browser API
export const browserAPI = {
  storage,
  tabs,
  runtime,
  history,
  getBrowserType
};