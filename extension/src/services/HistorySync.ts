import { Settings } from '../settings/Settings';
import { HistoryStore } from '../db/HistoryStore';
import { HistoryEntry } from '../types';
import { SyncService } from './SyncService';
import { SummarizationService } from './SummarizationService';

export class HistorySync {
  private settings: Settings;
  private store: HistoryStore;
  private syncService: SyncService;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  private summarizationService: SummarizationService;

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
    this.syncService = new SyncService(settings);
    this.summarizationService = SummarizationService.getInstance();
  }

  async init(): Promise<void> {
    await this.store.init();
    
    // Initialize summarization service if enabled
    const config = await this.settings.getConfig();
    if (config.enableSummarization) {
      await this.summarizationService.init(
        config.summarizationModel || 'Xenova/distilbart-cnn-6-6',
        config.debugSummarization || false
      );
    }
    
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

  private async generateSummary(url: string): Promise<string | null> {
    try {
      const config = await this.settings.getConfig();
      if (!config.enableSummarization) {
        return null;
      }

      // Skip summarization for certain URLs
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('about:') ||
          url.startsWith('file:')) {
        return null;
      }

      // Fetch the page content
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch page content for summarization: ${url}`);
        return null;
      }

      const html = await response.text();
      
      // Extract main content from HTML
      const mainContent = await this.summarizationService.extractMainContent(html);
      if (!mainContent || mainContent.length < 200) {
        return null;
      }

      // Generate summary
      const summary = await this.summarizationService.summarize(mainContent);
      
      if (config.debugSummarization && summary) {
        console.log(`Summary for ${url}:`, summary);
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
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
            
            // Generate summary if enabled
            let summary = null;
            const config = await this.settings.getConfig();
            if (config.enableSummarization) {
              try {
                summary = await this.generateSummary(result.url);
                if (config.debugSummarization) {
                  console.log(`Summary for ${result.url}:`, summary || 'No summary generated');
                }
              } catch (summaryError) {
                console.error('Error generating summary:', summaryError);
              }
            }
            
            await this.store.addEntry({
              visitId: `${latestVisit.visitId}`,
              url: result.url,
              title: result.title || '',
              visitTime: result.lastVisitTime || Date.now(),
              referringVisitId: latestVisit.referringVisitId?.toString() || '0',
              transition: latestVisit.transition,
              summary: summary || undefined,
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
      const config = await this.settings.getConfig();
      const enableSummarization = config.enableSummarization;

      // Process items in batches to avoid overwhelming the browser
      const BATCH_SIZE = 5;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (item) => {
          if (item.url) {
            // Generate summary once per URL
            let summary = null;
            if (enableSummarization) {
              try {
                summary = await this.generateSummary(item.url);
              } catch (summaryError) {
                console.error('Error generating summary for initial history:', summaryError);
              }
            }

            const visits = await chrome.history.getVisits({ url: item.url });
            for (const visit of visits) {
              await this.store.addEntry({
                visitId: `${visit.visitId}`,
                url: item.url,
                title: item.title || '',
                visitTime: visit.visitTime || Date.now(),
                referringVisitId: visit.referringVisitId?.toString() || '0',
                transition: visit.transition,
                summary: summary || undefined,
                ...systemInfo
              });
            }
          }
        }));
        
        // Small delay between batches to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
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
    const expirationDays = this.settings.config?.expirationDays || 7;
    const expirationTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
    const entries = await this.store.getEntries();
    return entries.filter(entry => entry.visitTime >= expirationTime);
  }
}