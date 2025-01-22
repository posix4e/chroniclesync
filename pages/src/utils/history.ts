import { DB, HistoryEntry } from './db';

export class HistoryManager {
  private db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async recordNavigation(url: string): Promise<void> {
    await this.db.addHistoryEntry('navigation', { url });
  }

  async recordPushState(url: string, state: any): Promise<void> {
    await this.db.addHistoryEntry('pushState', { url, state });
  }

  async recordReplaceState(url: string, state: any): Promise<void> {
    await this.db.addHistoryEntry('replaceState', { url, state });
  }

  async recordPopState(url: string, state: any): Promise<void> {
    await this.db.addHistoryEntry('popstate', { url, state });
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.db.getHistory();
  }

  async markEntriesAsSynced(timestamps: number[]): Promise<void> {
    await this.db.markEntriesAsSynced(timestamps);
  }
}