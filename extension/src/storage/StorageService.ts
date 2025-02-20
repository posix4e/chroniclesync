import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem } from '../history/HistoryViewer';

interface ChronicleDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: {
      'by-timestamp': number;
      'by-url': string;
      'by-sync-status': string;
    };
  };
}

const DB_NAME = 'chronicle-sync';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const MAX_ITEMS = 10000;

export class StorageService {
  private db: IDBPDatabase<ChronicleDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<ChronicleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const historyStore = db.createObjectStore(HISTORY_STORE, {
          keyPath: 'id',
        });
        historyStore.createIndex('by-timestamp', 'timestamp');
        historyStore.createIndex('by-url', 'url');
        historyStore.createIndex('by-sync-status', 'syncStatus');
      },
    });
  }

  async addHistoryItem(item: HistoryItem): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    await this.db!.put(HISTORY_STORE, item);
    await this.pruneOldItems();
  }

  async getHistoryItems(
    limit = 100,
    offset = 0,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<HistoryItem[]> {
    if (!this.db) {
      await this.init();
    }

    const items = await this.db!.getAllFromIndex(
      HISTORY_STORE,
      'by-timestamp',
      null,
      limit + offset
    );

    return sortOrder === 'desc'
      ? items.reverse().slice(offset, offset + limit)
      : items.slice(offset, offset + limit);
  }

  async searchHistoryItems(query: string): Promise<HistoryItem[]> {
    if (!this.db) {
      await this.init();
    }

    const allItems = await this.db!.getAll(HISTORY_STORE);
    const lowerQuery = query.toLowerCase();

    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.url.toLowerCase().includes(lowerQuery)
    );
  }

  async getItemsByStatus(status: HistoryItem['syncStatus']): Promise<HistoryItem[]> {
    if (!this.db) {
      await this.init();
    }

    return this.db!.getAllFromIndex(HISTORY_STORE, 'by-sync-status', status);
  }

  async updateSyncStatus(
    id: string,
    status: HistoryItem['syncStatus']
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const item = await this.db!.get(HISTORY_STORE, id);
    if (item) {
      item.syncStatus = status;
      await this.db!.put(HISTORY_STORE, item);
    }
  }

  async deleteHistoryItem(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    await this.db!.delete(HISTORY_STORE, id);
  }

  async exportData(): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const allItems = await this.db!.getAll(HISTORY_STORE);
    return JSON.stringify(allItems, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    try {
      const items = JSON.parse(jsonData) as HistoryItem[];
      const tx = this.db!.transaction(HISTORY_STORE, 'readwrite');
      await Promise.all(items.map((item) => tx.store.put(item)));
      await tx.done;
    } catch (error) {
      throw new Error('Failed to import data: Invalid format');
    }
  }

  private async pruneOldItems(): Promise<void> {
    const count = await this.db!.count(HISTORY_STORE);
    if (count > MAX_ITEMS) {
      const itemsToDelete = count - MAX_ITEMS;
      const oldestItems = await this.db!.getAllFromIndex(
        HISTORY_STORE,
        'by-timestamp',
        null,
        itemsToDelete
      );
      const tx = this.db!.transaction(HISTORY_STORE, 'readwrite');
      await Promise.all(
        oldestItems.map((item) => tx.store.delete(item.id))
      );
      await tx.done;
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    await this.db!.clear(HISTORY_STORE);
  }
}