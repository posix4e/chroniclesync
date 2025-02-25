import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry } from '../types';
import { SyncService } from './SyncService';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncService: SyncService;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
    this.syncService = new SyncService(settings);
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
          // Get visit details from chrome.history API
          const visits = await chrome.history.getVisits({ url: result.url });
          const latestVisit = visits[visits.length - 1];

          if (latestVisit) {
            const visitId = `${latestVisit.visitId}`;
            const platform = navigator.platform;
            const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
              navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown';

            await this.store.addEntry({
              visitId,
              url: result.url,
              title: result.title || '',
              visitTime: result.lastVisitTime || Date.now(),
              platform,
              browserName
            });
            console.log('History entry stored successfully');
          }
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

      const platform = navigator.platform;
      const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
        navigator.userAgent.includes('Firefox') ? 'Firefox' : 
          navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown';

      for (const item of items) {
        if (item.url) {
          const visits = await chrome.history.getVisits({ url: item.url });
          for (const visit of visits) {
            await this.store.addEntry({
              visitId: `${visit.visitId}`,
              url: item.url,
              title: item.title || '',
              visitTime: visit.visitTime || Date.now(),
              platform,
              browserName
            });
          }
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

    try {
      // Convert entries to the format expected by the sync service
      const historyVisits = entries.map(entry => ({
        visitId: entry.visitId,
        url: entry.url,
        title: entry.title,
        visitTime: entry.visitTime,
        platform: entry.platform,
        browserName: entry.browserName
      }));

      // Sync with server
      await this.syncService.syncHistory(historyVisits);

      // Mark entries as synced
      await Promise.all(entries.map(entry => this.store.markAsSynced(entry.url)));

      console.log('Successfully synced entries:', entries.length);
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.store.getEntries();
  }
}