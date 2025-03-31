/**
 * Platform adapter for Safari and Chrome compatibility
 * Provides a unified API for browser-specific functionality
 */

// Detect browser type
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Storage API adapter
export const storage = {
  local: {
    get: async <T>(keys: string | string[] | null): Promise<T> => {
      if (isSafari()) {
        // Safari Web Extension API
        return new Promise((resolve) => {
          const keysArray = keys ? (typeof keys === 'string' ? [keys] : keys) : null;
          browser.storage.local.get(keysArray).then((result: T) => {
            resolve(result);
          });
        });
      } else {
        // Chrome API
        return chrome.storage.local.get(keys) as Promise<T>;
      }
    },
    
    set: async (items: Record<string, any>): Promise<void> => {
      if (isSafari()) {
        // Safari Web Extension API
        return browser.storage.local.set(items);
      } else {
        // Chrome API
        return chrome.storage.local.set(items);
      }
    }
  },
  
  sync: {
    get: async <T>(keys: string | string[] | null): Promise<T> => {
      if (isSafari()) {
        // Safari Web Extension API
        return new Promise((resolve) => {
          const keysArray = keys ? (typeof keys === 'string' ? [keys] : keys) : null;
          browser.storage.sync.get(keysArray).then((result: T) => {
            resolve(result);
          });
        });
      } else {
        // Chrome API
        return chrome.storage.sync.get(keys) as Promise<T>;
      }
    },
    
    set: async (items: Record<string, any>): Promise<void> => {
      if (isSafari()) {
        // Safari Web Extension API
        return browser.storage.sync.set(items);
      } else {
        // Chrome API
        return chrome.storage.sync.set(items);
      }
    }
  }
};

// Runtime API adapter
export const runtime = {
  sendMessage: async <T>(message: any): Promise<T> => {
    if (isSafari()) {
      // Safari Web Extension API
      return browser.runtime.sendMessage(message);
    } else {
      // Chrome API
      return chrome.runtime.sendMessage(message);
    }
  },
  
  onMessage: {
    addListener: (callback: (message: any, sender: any, sendResponse: any) => boolean | void) => {
      if (isSafari()) {
        // Safari Web Extension API
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          const result = callback(message, sender, sendResponse);
          // Return true to indicate async response
          return result === true;
        });
      } else {
        // Chrome API
        chrome.runtime.onMessage.addListener(callback);
      }
    }
  }
};

// History API adapter (minimal implementation)
export const history = {
  search: async (query: chrome.history.HistoryQuery): Promise<chrome.history.HistoryItem[]> => {
    if (isSafari()) {
      // Safari Web Extension API
      return browser.history.search(query);
    } else {
      // Chrome API
      return chrome.history.search(query);
    }
  },
  
  getVisits: async (details: { url: string }): Promise<chrome.history.VisitItem[]> => {
    if (isSafari()) {
      // Safari Web Extension API
      return browser.history.getVisits(details);
    } else {
      // Chrome API
      return chrome.history.getVisits(details);
    }
  }
};

// Tabs API adapter (minimal implementation)
export const tabs = {
  onUpdated: {
    addListener: (callback: (tabId: number, changeInfo: any, tab: any) => void) => {
      if (isSafari()) {
        // Safari Web Extension API
        browser.tabs.onUpdated.addListener(callback);
      } else {
        // Chrome API
        chrome.tabs.onUpdated.addListener(callback);
      }
    }
  }
};