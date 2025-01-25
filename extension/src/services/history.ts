import { IndexedDBStore } from '../storage/indexeddb';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  lastVisitTime: number;
  visitCount: number;
  typedCount: number;
}

export class HistoryService {
  private store: IndexedDBStore;
  private static STORE_NAME = 'history';

  constructor(store: IndexedDBStore) {
    this.store = store;
  }

  async syncHistory(startTime?: number): Promise<void> {
    const query: chrome.history.HistoryQuery = {
      text: '',
      maxResults: 1000,
      startTime: startTime || Date.now() - (7 * 24 * 60 * 60 * 1000) // Default to last 7 days
    };

    const items = await chrome.history.search(query);
    const historyItems: HistoryItem[] = await Promise.all(
      items.map(async (item) => {
        const visits = await chrome.history.getVisits({ url: item.url });
        return {
          id: btoa(item.url), // Use base64 encoded URL as ID
          url: item.url,
          title: item.title || '',
          visitTime: visits[0]?.visitTime || 0,
          lastVisitTime: item.lastVisitTime || 0,
          visitCount: item.visitCount || 0,
          typedCount: item.typedCount || 0
        };
      })
    );

    // Store history items in IndexedDB
    await Promise.all(
      historyItems.map(item => this.store.put(HistoryService.STORE_NAME, item))
    );
  }

  async getHistory(): Promise<HistoryItem[]> {
    return this.store.getAll(HistoryService.STORE_NAME);
  }

  async getHistoryItem(id: string): Promise<HistoryItem | undefined> {
    return this.store.get(HistoryService.STORE_NAME, id);
  }

  async deleteHistoryItem(id: string): Promise<void> {
    await this.store.delete(HistoryService.STORE_NAME, id);
  }

  async clearHistory(): Promise<void> {
    await this.store.clear(HistoryService.STORE_NAME);
  }
}