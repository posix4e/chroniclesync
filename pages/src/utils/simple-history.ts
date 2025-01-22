import { DB } from './db';

export interface HistoryEntry {
  url: string;
  timestamp: number;
  title: string;
  synced: boolean;
}

export class SimpleHistoryManager {
  private db: DB;
  private syncInProgress = false;

  constructor(db: DB) {
    this.db = db;
    this.setupSync();
  }

  private setupSync() {
    // Simple sync interval
    setInterval(() => this.syncHistory(), 5000);

    // Listen for online/offline events
    window.addEventListener('online', () => this.syncHistory());
  }

  async addEntry(url: string, title: string): Promise<void> {
    const entry: HistoryEntry = {
      url,
      title,
      timestamp: Date.now(),
      synced: false
    };

    await this.db.addHistoryEntry('navigation', entry);
    this.syncHistory();
  }

  async getEntries(): Promise<HistoryEntry[]> {
    const entries = await this.db.getHistory() || [];
    return entries.map(e => ({
      url: (e.data as { url?: string })?.url || '',
      title: (e.data as { title?: string })?.title || '',
      timestamp: e.timestamp,
      synced: e.synced || false
    }));
  }

  private async syncHistory(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    try {
      this.syncInProgress = true;
      const entries = await this.getEntries();
      const unsyncedEntries = entries.filter(e => !e.synced);

      if (unsyncedEntries.length === 0) return;

      // Send to background script for sync
      await chrome.runtime.sendMessage({
        type: 'SYNC_HISTORY',
        entries: unsyncedEntries
      });

      // Mark entries as synced
      const timestamps = unsyncedEntries.map(e => e.timestamp);
      await this.db.markEntriesAsSynced(timestamps);
    } finally {
      this.syncInProgress = false;
    }
  }
}