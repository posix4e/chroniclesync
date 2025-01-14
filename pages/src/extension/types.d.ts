/* eslint-disable @typescript-eslint/no-unused-vars */
export interface StorageData {
  clientId?: string;
  lastSync?: number;
}

export interface HistoryItem {
  url: string;
  title: string;
  lastVisitTime?: number;
  visitCount?: number;
}

export interface Tab {
  id: number;
  url: string;
  title?: string;
  active: boolean;
  windowId: number;
}

export interface HistoryQuery {
  text: string;
  startTime: number;
  maxResults: number;
}

export interface HistoryUrlDetails {
  url: string;
  title?: string;
}

export interface TabCreateDetails {
  url: string;
  active?: boolean;
  windowId?: number;
}

declare function importScripts(..._urls: string[]): void;

declare namespace browser {
  const storage: {
    local: {
      get(_keys: string[]): Promise<StorageData>;
      set(_items: Partial<StorageData>): Promise<void>;
    };
  };
  const history: {
    search(_query: HistoryQuery): Promise<HistoryItem[]>;
    addUrl(_details: HistoryUrlDetails): Promise<void>;
    onVisited: {
      addListener(_callback: (_result: HistoryItem) => void): void;
      removeListener(_callback: (_result: HistoryItem) => void): void;
    };
  };
  const tabs: {
    create(_details: TabCreateDetails): Promise<Tab>;
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */