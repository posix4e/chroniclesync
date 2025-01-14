declare function importScripts(..._urls: string[]): void;

interface StorageData {
  clientId?: string;
  lastSync?: number;
}

interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount: number;
}

interface Tab {
  id: number;
  url: string;
  title?: string;
  active: boolean;
  windowId: number;
}

declare namespace browser {
  const storage: {
    local: {
      get(_keys: string[]): Promise<StorageData>;
      set(_items: Partial<StorageData>): Promise<void>;
    };
  };
  const history: {
    search(_query: {
      text: string;
      startTime: number;
      maxResults: number;
    }): Promise<HistoryItem[]>;
    addUrl(_details: {
      url: string;
      title?: string;
    }): Promise<void>;
    onVisited: {
      addListener(callback: (result: HistoryItem) => void): void;
      removeListener(callback: (result: HistoryItem) => void): void;
    };
  };
  const tabs: {
    create(_details: {
      url: string;
      active?: boolean;
      windowId?: number;
    }): Promise<Tab>;
  };
}