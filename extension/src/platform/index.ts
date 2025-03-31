// Platform adapter to handle differences between Chrome and Safari APIs

// Define browser type for Safari WebExtension API
declare namespace browser {
  const storage: typeof chrome.storage;
  const tabs: typeof chrome.tabs;
  const runtime: typeof chrome.runtime;
}

// Detect platform at runtime
const detectSafari = (): boolean => {
  return typeof window !== 'undefined' && 
         navigator.userAgent.includes('Safari') && 
         !navigator.userAgent.includes('Chrome') &&
         typeof (window as any).browser !== 'undefined';
};

// Storage adapter
export const storage = {
  get: async (keys: string | string[] | object) => {
    if (detectSafari()) {
      return (window as any).browser.storage.local.get(keys);
    } else {
      return chrome.storage.local.get(keys);
    }
  },
  
  set: async (items: object) => {
    if (detectSafari()) {
      return (window as any).browser.storage.local.set(items);
    } else {
      return chrome.storage.local.set(items);
    }
  },
  
  remove: async (keys: string | string[]) => {
    if (detectSafari()) {
      return (window as any).browser.storage.local.remove(keys);
    } else {
      return chrome.storage.local.remove(keys);
    }
  },
  
  clear: async () => {
    if (detectSafari()) {
      return (window as any).browser.storage.local.clear();
    } else {
      return chrome.storage.local.clear();
    }
  }
};

// Tabs adapter
export const tabs = {
  query: async (queryInfo: chrome.tabs.QueryInfo) => {
    if (detectSafari()) {
      return (window as any).browser.tabs.query(queryInfo);
    } else {
      return chrome.tabs.query(queryInfo);
    }
  },
  
  create: async (createProperties: chrome.tabs.CreateProperties) => {
    if (detectSafari()) {
      return (window as any).browser.tabs.create(createProperties);
    } else {
      return chrome.tabs.create(createProperties);
    }
  },
  
  update: async (tabId: number, updateProperties: chrome.tabs.UpdateProperties) => {
    if (detectSafari()) {
      return (window as any).browser.tabs.update(tabId, updateProperties);
    } else {
      return chrome.tabs.update(tabId, updateProperties);
    }
  },
  
  sendMessage: async (tabId: number, message: any) => {
    if (detectSafari()) {
      return (window as any).browser.tabs.sendMessage(tabId, message);
    } else {
      return chrome.tabs.sendMessage(tabId, message);
    }
  }
};

// Runtime adapter
export const runtime = {
  sendMessage: async (message: any) => {
    if (detectSafari()) {
      return (window as any).browser.runtime.sendMessage(message);
    } else {
      return chrome.runtime.sendMessage(message);
    }
  },
  
  onMessage: {
    addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
      if (detectSafari()) {
        (window as any).browser.runtime.onMessage.addListener(callback);
      } else {
        chrome.runtime.onMessage.addListener(callback);
      }
    },
    
    removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
      if (detectSafari()) {
        (window as any).browser.runtime.onMessage.removeListener(callback);
      } else {
        chrome.runtime.onMessage.removeListener(callback);
      }
    }
  }
};

// Define a type for URL details to fix the UrlDetails error
interface UrlDetails {
  url: string;
}

// History adapter (Safari has limited history API support)
export const history = {
  search: async (query: chrome.history.HistoryQuery) => {
    if (detectSafari()) {
      // Safari doesn't have a direct equivalent, so we'll return an empty array
      // In a real implementation, you might use a different approach or store history in your own DB
      console.warn('History API not fully supported in Safari');
      return [];
    } else {
      return chrome.history.search(query);
    }
  },
  
  getVisits: async (details: UrlDetails) => {
    if (detectSafari()) {
      // Safari doesn't have a direct equivalent
      console.warn('History API not fully supported in Safari');
      return [];
    } else {
      return chrome.history.getVisits(details);
    }
  }
};

// Export the platform adapter
export default {
  storage,
  tabs,
  runtime,
  history,
  isSafari: detectSafari()
};