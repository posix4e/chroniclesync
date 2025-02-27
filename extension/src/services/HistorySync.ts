import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry } from '../types';
import { SyncService } from './SyncService';
import { SummaryService } from './SummaryService';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncService: SyncService;
  private summaryService: SummaryService;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
    this.syncService = new SyncService(settings);
    this.summaryService = new SummaryService(settings);
  }

  async init(): Promise<void> {
    console.log('[HistorySync] Initializing services...');
    await this.store.init();
    await this.summaryService.init();
    console.log('[HistorySync] Services initialized');
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
      console.log('[HistorySync] New history entry:', result);
      if (result.url) {
        try {
          // Get visit details from chrome.history API
          const visits = await chrome.history.getVisits({ url: result.url });
          const latestVisit = visits[visits.length - 1];

          if (latestVisit) {
            // Fetch page content
            console.log('[HistorySync] Fetching page content...');
            let content = '';
            try {
              const response = await fetch(result.url);
              content = await response.text();
              console.log('[HistorySync] Page content fetched successfully');
            } catch (error) {
              console.error('[HistorySync] Error fetching page content:', error);
            }

            const systemInfo = await this.getSystemInfo();
            const entry: HistoryEntry = {
              visitId: `${latestVisit.visitId}`,
              url: result.url,
              title: result.title || '',
              visitTime: result.lastVisitTime || Date.now(),
              referringVisitId: latestVisit.referringVisitId?.toString() || '0',
              transition: latestVisit.transition,
              content,
              ...systemInfo,
              syncStatus: 'pending',
              lastModified: Date.now()
            };
            
            await this.store.addEntry(entry);
            console.log('[HistorySync] History entry stored successfully');

            // Process summary for the new entry
            console.log('[HistorySync] Processing summary for new entry...');
            await this.summaryService.processEntry(entry);
            console.log('[HistorySync] Summary processing complete');
          }
        } catch (error) {
          console.error('[HistorySync] Error storing history entry:', error);
        }
      }
    });
  }

  private async loadInitialHistory(): Promise<void> {
    console.log('[HistorySync] Loading initial history...');
    try {
      const expirationDays = this.settings.config?.expirationDays || 7;
      const items = await chrome.history.search({
        text: '',
        maxResults: 100,
        startTime: Date.now() - (expirationDays * 24 * 60 * 60 * 1000)
      });

      console.log('[HistorySync] Found initial history items:', items.length);

      const systemInfo = await this.getSystemInfo();
      const entries: HistoryEntry[] = [];

      for (const item of items) {
        if (item.url) {
          // Fetch page content
          console.log(`[HistorySync] Fetching content for ${item.url}...`);
          let content = '';
          try {
            const response = await fetch(item.url);
            content = await response.text();
            console.log(`[HistorySync] Content fetched for ${item.url}`);
          } catch (error) {
            console.error(`[HistorySync] Error fetching content for ${item.url}:`, error);
          }

          const visits = await chrome.history.getVisits({ url: item.url });
          for (const visit of visits) {
            const entry: HistoryEntry = {
              visitId: `${visit.visitId}`,
              url: item.url,
              title: item.title || '',
              visitTime: visit.visitTime || Date.now(),
              referringVisitId: visit.referringVisitId?.toString() || '0',
              transition: visit.transition,
              content,
              ...systemInfo,
              syncStatus: 'pending',
              lastModified: Date.now()
            };
            entries.push(entry);
            await this.store.addEntry(entry);
          }
        }
      }

      console.log('[HistorySync] Processing summaries for initial entries...');
      await this.summaryService.processPendingEntries(entries);
      console.log('[HistorySync] Initial history loaded and processed successfully');
    } catch (error) {
      console.error('[HistorySync] Error loading initial history:', error);
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
      // Convert entries to the format expected by the sync service
      const historyVisits = validEntries.map(entry => ({
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
      await Promise.all(validEntries.map(entry => this.store.markAsSynced(entry.url)));

      console.log('Successfully synced entries:', validEntries.length);
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  async getHistory(): Promise<HistoryEntry[]> {
    console.log('[HistorySync] Fetching history entries...');
    const expirationDays = this.settings.config?.expirationDays || 7;
    const expirationTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
    const entries = await this.store.getEntries();
    const validEntries = entries.filter(entry => entry.visitTime >= expirationTime);
    
    console.log('[HistorySync] Processing summaries for entries...');
    await this.summaryService.processPendingEntries(validEntries);
    
    return validEntries;
  }
}