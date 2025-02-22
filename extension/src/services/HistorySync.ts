import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry } from '../types';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
  }

  async init(): Promise<void> {
    await this.store.init();
    this.setupHistoryListener();
  }

  private setupHistoryListener(): void {
    chrome.history.onVisited.addListener(async (result) => {
      if (result.url) {
        try {
          await this.store.addEntry({
            url: result.url,
            title: result.title || '',
            timestamp: Date.now(),
            visitCount: 1,
            lastVisitTime: result.lastVisitTime || Date.now()
          });
        } catch (error) {
          console.error('Error storing history entry:', error);
        }
      }
    });
  }

  async startSync(): Promise<void> {
    if (this.syncInterval) return;

    await this.syncPendingEntries();
    this.syncInterval = window.setInterval(() => {
      this.syncPendingEntries().catch(error => {
        console.error('Error during sync:', error);
      });
    }, this.SYNC_INTERVAL_MS);
  }

  stopSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncPendingEntries(): Promise<void> {
    const entries = await this.store.getUnsyncedEntries();
    if (entries.length === 0) return;

    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    try {
      const response = await fetch(`${apiUrl}/history/sync`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Client-ID': clientId
        }),
        body: JSON.stringify({ entries })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // Mark entries as synced
      await Promise.all(entries.map(entry => this.store.markAsSynced(entry.url)));
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  async getHistory(limit = 100): Promise<HistoryEntry[]> {
    return this.store.getEntries(limit);
  }
}