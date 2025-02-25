import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { EncryptedHistoryEntry } from '../types';
import { SyncService } from './SyncService';
import { EncryptionService } from './EncryptionService';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncService: SyncService;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(settings: Settings) {
    this.settings = settings;
    const encryptionService = new EncryptionService();
    this.store = new HistoryStore(encryptionService);
    this.syncService = new SyncService(settings);
  }

  async init(): Promise<void> {
    const encryptionService = new EncryptionService();
    await encryptionService.init(this.settings.getMnemonic());
    this.store = new HistoryStore(encryptionService);
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

            const sensitiveData = {
              url: result.url,
              title: result.title || ''
            };

            const encryptionService = new EncryptionService();
            await encryptionService.init(this.settings.getMnemonic());
            const encryptedData = await encryptionService.encrypt(JSON.stringify(sensitiveData));

            await this.store.addEntry({
              visitId,
              visitTime: result.lastVisitTime || Date.now(),
              platform,
              browserName,
              encryptedData
            });
            console.log('Encrypted history entry stored successfully');
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

      const encryptionService = new EncryptionService();
      await encryptionService.init(this.settings.getMnemonic());

      for (const item of items) {
        if (item.url) {
          const visits = await chrome.history.getVisits({ url: item.url });
          for (const visit of visits) {
            const sensitiveData = {
              url: item.url,
              title: item.title || ''
            };

            const encryptedData = await encryptionService.encrypt(JSON.stringify(sensitiveData));

            await this.store.addEntry({
              visitId: `${visit.visitId}`,
              visitTime: visit.visitTime || Date.now(),
              platform,
              browserName,
              encryptedData
            });
          }
        }
      }
      console.log('Initial encrypted history loaded successfully');
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
        visitTime: entry.visitTime,
        platform: entry.platform,
        browserName: entry.browserName,
        encryptedData: entry.encryptedData
      }));

      // Sync with server
      await this.syncService.syncHistory(historyVisits);

      // Mark entries as synced
      await Promise.all(entries.map(entry => this.store.markAsSynced(entry.visitId)));

      console.log('Successfully synced encrypted entries:', entries.length);
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  async getHistory(limit = 100): Promise<EncryptedHistoryEntry[]> {
    return this.store.getEntries(limit);
  }
}