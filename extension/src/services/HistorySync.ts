import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry } from '../types/history';

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

  private async getSystemInfo() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const browserName = userAgent.includes('Chrome') ? 'Chrome' : 
      userAgent.includes('Firefox') ? 'Firefox' : 
        userAgent.includes('Safari') ? 'Safari' : 'Unknown';
    const browserVersion = (userAgent.match(/Chrome\/([0-9.]+)/) || ['', 'unknown'])[1];
    const deviceId = await this.getDeviceId();

    return {
      deviceId,
      platform,
      userAgent,
      browserName,
      browserVersion
    };
  }

  private async getDeviceId(): Promise<string> {
    const result = await chrome.storage.local.get(['deviceId']);
    if (result.deviceId) {
      return result.deviceId;
    }
    const deviceId = 'device_' + Math.random().toString(36).substring(2);
    await chrome.storage.local.set({ deviceId });
    return deviceId;
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
            const systemInfo = await this.getSystemInfo();
            await this.store.addEntry({
              visitId: `${latestVisit.visitId}`,
              url: result.url,
              title: result.title || '',
              visitTime: result.lastVisitTime || Date.now(),
              referringVisitId: latestVisit.referringVisitId?.toString() || '0',
              transition: latestVisit.transition,
              version: 1,
              ...systemInfo
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
      const expirationDays = this.settings.config?.expirationDays || 7;
      const items = await chrome.history.search({
        text: '',
        maxResults: 100,
        startTime: Date.now() - (expirationDays * 24 * 60 * 60 * 1000)
      });

      console.log('Found initial history items:', items.length);

      const systemInfo = await this.getSystemInfo();

      for (const item of items) {
        if (item.url) {
          const visits = await chrome.history.getVisits({ url: item.url });
          for (const visit of visits) {
            await this.store.addEntry({
              visitId: `${visit.visitId}`,
              url: item.url,
              title: item.title || '',
              visitTime: visit.visitTime || Date.now(),
              referringVisitId: visit.referringVisitId?.toString() || '0',
              transition: visit.transition,
              version: 1,
              ...systemInfo
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
    const expirationDays = this.settings.config?.expirationDays || 7;
    const expirationTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
    
    const entries = await this.store.getUnsyncedEntries();
    const validEntries = entries.filter(entry => entry.visitTime >= expirationTime);
    if (validEntries.length === 0) return;

    try {
      // Get entries with completed summaries
      const entriesWithSummaries = await this.store.getEntriesWithSummaries();
      const summaryMap = new Map(entriesWithSummaries.map(entry => [entry.visitId, entry]));

      // Convert entries to the format expected by the sync service
      const historyVisits = validEntries.map(entry => {
        const summaryEntry = summaryMap.get(entry.visitId);
        return {
          visitId: entry.visitId,
          url: entry.url,
          title: entry.title,
          visitTime: entry.visitTime,
          platform: entry.platform || 'unknown',
          browserName: entry.browserName || 'unknown',
          summary: summaryEntry?.summary ? {
            content: summaryEntry.summary.content,
            status: summaryEntry.summaryStatus === 'completed' ? 'completed' as const : 'error' as const,
            lastModified: summaryEntry.summaryLastModified || Date.now(),
            version: summaryEntry.summaryVersion || 1
          } : undefined,
          summaryStatus: summaryEntry?.summaryStatus,
          summaryError: summaryEntry?.summaryError,
          summaryLastModified: summaryEntry?.summaryLastModified,
          summaryVersion: summaryEntry?.summaryVersion
        };
      });

      // Sync with server
      await this.syncService.syncHistory(historyVisits);

      // Mark entries as synced
      await Promise.all(validEntries.map(entry => this.store.markAsSynced(entry.url)));

      // Sync summaries from other devices
      const lastSyncTime = await this.getLastSyncTime();
      const remoteSummaries = (await this.syncService.syncSummaries(lastSyncTime)) as Array<{
        visitId: string;
        text: string;
        lastModified: number;
        version: number;
      }> | undefined;
      
      // Update local summaries
      if (remoteSummaries && remoteSummaries.length > 0) {
        await Promise.all(
          remoteSummaries.map(summary => 
            this.store.updateSummary(summary.visitId, {
              content: summary.text,
              status: 'completed',
              lastModified: summary.lastModified,
              version: summary.version
            })
          )
        );
      }

      // Update last sync time
      await this.updateLastSyncTime();

      console.log('Successfully synced entries:', validEntries.length);
      console.log('Successfully synced summaries:', (remoteSummaries || []).length);
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  private async getLastSyncTime(): Promise<number> {
    const result = await chrome.storage.local.get(['lastSummarySync']);
    return result.lastSummarySync || 0;
  }

  private async updateLastSyncTime(): Promise<void> {
    await chrome.storage.local.set({ lastSummarySync: Date.now() });
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const expirationDays = this.settings.config?.expirationDays || 7;
    const expirationTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
    const entries = await this.store.getEntries();
    return entries.filter(entry => entry.visitTime >= expirationTime);
  }

  async getHistoryEntry(visitId: string): Promise<HistoryEntry | null> {
    const entries = await this.store.getEntries();
    return entries.find(entry => entry.visitId === visitId) || null;
  }

  getHistoryStore(): HistoryStore {
    return this.store;
  }

  async initStore(): Promise<void> {
    await this.store.init();
  }
}