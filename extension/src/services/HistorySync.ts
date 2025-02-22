import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry, EncryptedHistoryVisit } from '../types';
import { SyncService } from './SyncService';
import { EncryptionManager } from '../utils/encryption';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncService: SyncService;
  private encryptionManager: EncryptionManager;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
    this.syncService = new SyncService(settings);
    this.encryptionManager = new EncryptionManager();
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
      // Convert and encrypt entries
      const historyVisits = await Promise.all(entries.map(async entry => {
        // Ensure we have string values to encrypt
        const urlToEncrypt = typeof entry.url === 'string' ? entry.url : JSON.stringify(entry.url);
        const titleToEncrypt = typeof entry.title === 'string' ? entry.title : JSON.stringify(entry.title);

        const encryptedUrl = await this.encryptionManager.encrypt(urlToEncrypt);
        const encryptedTitle = await this.encryptionManager.encrypt(titleToEncrypt);

        const encryptedVisit: EncryptedHistoryVisit = {
          visitId: entry.visitId,
          url: {
            encrypted: true,
            ...encryptedUrl
          },
          title: {
            encrypted: true,
            ...encryptedTitle
          },
          visitTime: entry.visitTime,
          platform: entry.platform,
          browserName: entry.browserName
        };

        return encryptedVisit;
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

  async getHistory(limit = 100): Promise<HistoryEntry[]> {
    const entries = await this.store.getEntries(limit);
    
    // Decrypt entries if they are encrypted
    return Promise.all(entries.map(async entry => {
      if (typeof entry.url === 'object' && entry.url.encrypted) {
        const decryptedUrl = await this.encryptionManager.decrypt(entry.url);
        entry.url = decryptedUrl;
      }
      
      if (typeof entry.title === 'object' && entry.title.encrypted) {
        const decryptedTitle = await this.encryptionManager.decrypt(entry.title);
        entry.title = decryptedTitle;
      }
      
      return entry;
    }));
  }
}