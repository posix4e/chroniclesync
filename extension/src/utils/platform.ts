/**
 * Platform detection and API compatibility layer
 */

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
  } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.id) {
    // Check for Firefox-specific APIs
    if (typeof browser.runtime.getBrowserInfo === 'function') {
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
export function getBrowserAPI() {
  // For Chrome and others that don't support the browser namespace
  if (typeof browser === 'undefined') {
    return chrome;
  }
  
  // For Firefox and Safari that support the browser namespace
  return browser;
}

/**
 * Normalizes the browser.tabs.query API to work across browsers
 */
export async function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  const browserAPI = getBrowserAPI();
  
  if (detectBrowser() === BrowserType.Chrome) {
    return new Promise((resolve) => {
      browserAPI.tabs.query(queryInfo, resolve);
    });
  } else {
    // Firefox and Safari use promises
    return browserAPI.tabs.query(queryInfo);
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
        return new Promise((resolve) => {
          browserAPI.storage.local.get(keys, resolve);
        });
      } else {
        // Firefox and Safari use promises
        return browserAPI.storage.local.get(keys);
      }
    },
    
    set: async (items: object): Promise<void> => {
      const browserAPI = getBrowserAPI();
      
      if (detectBrowser() === BrowserType.Chrome) {
        return new Promise((resolve) => {
          browserAPI.storage.local.set(items, () => resolve());
        });
      } else {
        // Firefox and Safari use promises
        return browserAPI.storage.local.set(items);
      }
    }
  }
};

/**
 * Normalizes the browser.runtime API to work across browsers
 */
export const runtime = {
  sendMessage: async <T>(message: any): Promise<T> => {
    const browserAPI = getBrowserAPI();
    
    if (detectBrowser() === BrowserType.Chrome) {
      return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage(message, (response) => {
          if (browserAPI.runtime.lastError) {
            reject(browserAPI.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    } else {
      // Firefox and Safari use promises
      return browserAPI.runtime.sendMessage(message);
    }
  }
};