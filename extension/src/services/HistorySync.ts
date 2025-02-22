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
    console.log('Setting up history listener...');
    
    // Load initial history
    this.loadInitialHistory();

    // Listen for new history entries
    chrome.history.onVisited.addListener(async (result) => {
      console.log('New history entry:', result);
      if (result.url) {
        try {
          // Get visit count from chrome.history API
          const [historyItem] = await chrome.history.getVisits({ url: result.url });
          const visitCount = historyItem ? 1 : 1; // Default to 1 if not found

          await this.store.addEntry({
            url: result.url,
            title: result.title || '',
            timestamp: Date.now(),
            visitCount,
            lastVisitTime: result.lastVisitTime || Date.now()
          });
          console.log('History entry stored successfully');
        } catch (error) {
          console.error('Error storing history entry:', error);
        }
      }
    });
  }

  private async loadInitialHistory(): Promise<void> {
    console.log('Loading initial history...');
    try {
      const items = await chrome.history.search({
        text: '',
        maxResults: 100,
        startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
      });

      console.log('Found initial history items:', items.length);

      for (const item of items) {
        if (item.url) {
          const visits = await chrome.history.getVisits({ url: item.url });
          await this.store.addEntry({
            url: item.url,
            title: item.title || '',
            timestamp: Date.now(),
            visitCount: visits.length,
            lastVisitTime: item.lastVisitTime || Date.now()
          });
        }
      }
      console.log('Initial history loaded successfully');
    } catch (error) {
      console.error('Error loading initial history:', error);
    }
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