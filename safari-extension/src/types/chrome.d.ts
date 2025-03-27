// Type definitions for Chrome API in Safari
// This is a simplified version to make the TypeScript compiler happy

declare namespace chrome {
  namespace runtime {
    const lastError: { message: string } | undefined;
    function sendMessage(message: any, callback?: (response: any) => void): Promise<any>;
    function getURL(path: string): string;
    function openOptionsPage(): void;
    const onMessage: {
      addListener(callback: (request: any, sender: any, sendResponse: any) => void): void;
      removeListener(callback: (request: any, sender: any, sendResponse: any) => void): void;
    };
  }

  namespace tabs {
    function query(queryInfo: any, callback?: (tabs: any[]) => void): Promise<any[]>;
    function create(createProperties: any, callback?: (tab: any) => void): Promise<any>;
    function update(tabId: number, updateProperties: any, callback?: (tab: any) => void): Promise<any>;
    const onUpdated: {
      addListener(callback: (tabId: number, changeInfo: any, tab: any) => void): void;
    };
    function sendMessage(tabId: number, message: any, callback?: (response: any) => void): Promise<any>;
  }

  namespace storage {
    const sync: {
      get(keys: string | string[] | object | null, callback?: (items: any) => void): Promise<any>;
      set(items: object, callback?: () => void): Promise<void>;
      remove(keys: string | string[], callback?: () => void): Promise<void>;
    };
    const local: {
      get(keys: string | string[] | object | null, callback?: (items: any) => void): Promise<any>;
      set(items: object, callback?: () => void): Promise<void>;
      remove(keys: string | string[], callback?: () => void): Promise<void>;
    };
  }

  namespace history {
    interface VisitItem {
      id?: string;
      visitId: number;
      visitTime?: number;
      referringVisitId?: number;
      transition?: string;
    }
    
    function search(query: any, callback?: (results: any[]) => void): Promise<any[]>;
    function getVisits(details: { url: string }): Promise<VisitItem[]>;
    function deleteUrl(details: { url: string }, callback?: () => void): Promise<void>;
  }

  namespace windows {
    function create(createProperties: any, callback?: (window: any) => void): Promise<any>;
  }

  namespace devtools {
    const panels: {
      create(title: string, iconPath: string, pagePath: string, callback?: (panel: any) => void): void;
    };
  }
}

// Declare chrome as a global variable
declare const chrome: typeof chrome;