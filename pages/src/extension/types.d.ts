/* eslint-disable @typescript-eslint/no-unused-vars */
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

interface HistoryQuery {
  text: string;
  startTime: number;
  maxResults: number;
}

interface HistoryUrlDetails {
  url: string;
  title?: string;
}

interface TabCreateDetails {
  url: string;
  active?: boolean;
  windowId?: number;
}

declare function importScripts(...urls: string[]): void;

declare namespace browser {
  const storage: {
    local: {
      get(keys: string[]): Promise<StorageData>;
      set(items: Partial<StorageData>): Promise<void>;
    };
  };
  const history: {
    search(query: HistoryQuery): Promise<HistoryItem[]>;
    addUrl(details: HistoryUrlDetails): Promise<void>;
    onVisited: {
      addListener(callback: (result: HistoryItem) => void): void;
      removeListener(callback: (result: HistoryItem) => void): void;
    };
  };
  const tabs: {
    create(details: TabCreateDetails): Promise<Tab>;
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */