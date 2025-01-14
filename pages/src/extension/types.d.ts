declare function importScripts(...urls: string[]): void;

declare namespace browser {
  const storage: {
    local: {
      get(keys: string[]): Promise<Record<string, any>>;
      set(items: Record<string, any>): Promise<void>;
    };
  };
  const history: {
    search(query: {
      text: string;
      startTime: number;
      maxResults: number;
    }): Promise<Array<{
      url: string;
      title: string;
      lastVisitTime: number;
      visitCount: number;
    }>>;
    addUrl(details: {
      url: string;
      title?: string;
    }): Promise<void>;
  };
  const tabs: {
    create(details: {
      url: string;
    }): Promise<any>;
  };
}