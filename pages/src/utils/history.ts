import { DB } from './db';

interface HistoryState {
  url: string;
  title: string;
  state: unknown;
}

export class HistoryManager {
  private db: DB;
  private isInitialized = false;
  private pendingSync: HistoryState[] = [];
  private lastSyncTimestamp = 0;

  constructor(db: DB) {
    this.db = db;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Monitor History API methods
    this.monitorHistoryAPI();
    
    // Monitor popstate events
    window.addEventListener('popstate', this.handlePopState);

    // Load and apply any pending offline changes
    await this.syncPendingChanges();

    this.isInitialized = true;
  }

  private monitorHistoryAPI(): void {
    // Monitor pushState
    const originalPushState = history.pushState.bind(history);
    history.pushState = (state: unknown, title: string, url?: string | null) => {
      originalPushState(state, title, url);
      this.handleHistoryChange('pushState', { state, title, url: url || window.location.href });
    };

    // Monitor replaceState
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (state: unknown, title: string, url?: string | null) => {
      originalReplaceState(state, title, url);
      this.handleHistoryChange('replaceState', { state, title, url: url || window.location.href });
    };
  }

  private async handleHistoryChange(
    action: string,
    { state, title, url }: { state: unknown; title: string; url: string }
  ): Promise<void> {
    const entry: HistoryState = { state, title, url };

    // Store in IndexedDB
    await this.db.addHistoryEntry(action, entry);

    // If offline, store for later sync
    if (!navigator.onLine) {
      this.pendingSync.push(entry);
      return;
    }

    // Notify other clients through background script
    chrome.runtime.sendMessage({
      type: 'HISTORY_UPDATED',
      action,
      data: entry,
      timestamp: Date.now()
    });
  }

  private handlePopState = async (event: PopStateEvent): Promise<void> => {
    const entry: HistoryState = {
      state: event.state,
      title: document.title,
      url: window.location.href
    };

    await this.db.addHistoryEntry('popstate', entry);

    if (!navigator.onLine) {
      this.pendingSync.push(entry);
      return;
    }

    chrome.runtime.sendMessage({
      type: 'HISTORY_UPDATED',
      action: 'popstate',
      data: entry,
      timestamp: Date.now()
    });
  };

  async syncPendingChanges(): Promise<void> {
    // Get all unsynced history entries
    const entries = await this.db.getHistory();
    const unsyncedEntries = entries.filter(entry => !entry.synced);
    
    if (unsyncedEntries.length === 0) return;

    // Update last sync timestamp
    this.lastSyncTimestamp = Math.max(...entries.map(e => e.timestamp));

    // Send to background script for syncing
    await chrome.runtime.sendMessage({
      type: 'SYNC_HISTORY',
      entries: unsyncedEntries
    });

    // Mark entries as synced
    await this.db.markEntriesAsSynced(unsyncedEntries.map(e => e.timestamp));

    // Clear pending sync queue
    this.pendingSync = [];
  }

  async applyRemoteChanges(entries: Array<{ action: string; data: HistoryState; timestamp: number }>): Promise<void> {
    for (const entry of entries) {
      // Skip if we already have this entry
      const existingEntries = await this.db.getHistory(entry.timestamp);
      if (existingEntries.some(e => e.timestamp === entry.timestamp)) {
        continue;
      }

      // Add to local history
      await this.db.addHistoryEntry(entry.action, entry.data);

      // Apply the history change if it's recent (within last 5 minutes)
      const isFiveMinutesOld = Date.now() - entry.timestamp < 5 * 60 * 1000;
      if (isFiveMinutesOld) {
        switch (entry.action) {
        case 'pushState':
          history.pushState(entry.data.state, entry.data.title, entry.data.url);
          break;
        case 'replaceState':
          history.replaceState(entry.data.state, entry.data.title, entry.data.url);
          break;
          // For popstate, we don't automatically navigate as it might be disruptive
        }
      }
    }
  }

  // Clean up event listeners
  destroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
    // Restore original History API methods
    if (this.isInitialized) {
      history.pushState = History.prototype.pushState;
      history.replaceState = History.prototype.replaceState;
    }
    this.isInitialized = false;
  }
}