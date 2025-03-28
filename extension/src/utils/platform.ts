/**
 * Platform detection and API compatibility layer
 */

// Define browser type for Firefox/Safari WebExtension API
declare const browser: typeof chrome;

export enum BrowserType {
  Chrome = 'chrome',
  Firefox = 'firefox',
  Safari = 'safari',
  Unknown = 'unknown'
}

/**
 * Detects the current browser type
 */
export function detectBrowser(): BrowserType {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Chrome, Edge, Opera, Brave, etc.
    return BrowserType.Chrome;
  } else if (typeof window !== 'undefined' && 'browser' in window && 
             typeof (window as any).browser?.runtime?.id !== 'undefined') {
    // Check for Firefox-specific APIs
    if (typeof (window as any).browser?.runtime?.getBrowserInfo === 'function') {
      return BrowserType.Firefox;
    }
    // Safari uses WebExtension API but doesn't have Firefox-specific APIs
    return BrowserType.Safari;
  }
  
  return BrowserType.Unknown;
}

/**
 * Returns the appropriate browser API object based on the current browser
 */
export function getBrowserAPI(): typeof chrome {
  // For Chrome and others that don't support the browser namespace
  if (typeof window !== 'undefined' && !('browser' in window)) {
    return chrome;
  }
  
  // For Firefox and Safari that support the browser namespace
  return (window as any).browser as typeof chrome;
}

/**
 * Normalizes the browser.tabs.query API to work across browsers
 */
export async function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  const browserAPI = getBrowserAPI();
  
  if (detectBrowser() === BrowserType.Chrome) {
    return new Promise<chrome.tabs.Tab[]>((resolve) => {
      browserAPI.tabs.query(queryInfo, resolve);
    });
  } else {
    // Firefox and Safari use promises
    return browserAPI.tabs.query(queryInfo) as Promise<chrome.tabs.Tab[]>;
  }
}

/**
 * Normalizes the browser.storage API to work across browsers
 */
export const storage = {
  local: {
    get: async <T>(keys: string | string[] | null): Promise<T> => {
      const browserAPI = getBrowserAPI();
      
      if (detectBrowser() === BrowserType.Chrome) {
        return new Promise<T>((resolve) => {
          browserAPI.storage.local.get(keys, (result: T) => resolve(result));
        });
      } else {
        // Firefox and Safari use promises
        return browserAPI.storage.local.get(keys) as Promise<T>;
      }
    },
    
    set: async (items: object): Promise<void> => {
      const browserAPI = getBrowserAPI();
      
      if (detectBrowser() === BrowserType.Chrome) {
        return new Promise<void>((resolve) => {
          browserAPI.storage.local.set(items, () => resolve());
        });
      } else {
        // Firefox and Safari use promises
        return browserAPI.storage.local.set(items) as Promise<void>;
      }
    }
  }
};

/**
 * Normalizes the browser.runtime API to work across browsers
 */
export const runtime = {
  sendMessage: async <T>(message: unknown): Promise<T> => {
    const browserAPI = getBrowserAPI();
    
    if (detectBrowser() === BrowserType.Chrome) {
      return new Promise<T>((resolve, reject) => {
        browserAPI.runtime.sendMessage(message, (response: T) => {
          if (browserAPI.runtime.lastError) {
            reject(browserAPI.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    } else {
      // Firefox and Safari use promises
      return browserAPI.runtime.sendMessage(message) as Promise<T>;
    }
  }
};