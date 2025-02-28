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

  constructor(settings: Settings) {
    this.settings = settings;
    this.store = new HistoryStore();
    this.syncService = new SyncService(settings);
    
    // Initialize summarization service if enabled
    this.initSummarizationService();
  }
  
  private async initSummarizationService(): Promise<void> {
    const config = this.settings.config;
    if (config?.enableSummarization) {
      const summarizer = SummarizationService.getInstance();
      summarizer.setModel(config.summarizationModel || 'Xenova/distilbart-cnn-6-6');
      summarizer.setDebugMode(config.debugSummarization || false);
    }
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

  private async generateSummary(tabId: number, url: string): Promise<string> {
    try {
      const config = this.settings.config;
      if (!config?.enableSummarization) {
        return '';
      }
      
      // Skip summarization for certain URLs
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('about:') ||
          url.startsWith('file:')) {
        return '';
      }
      
      // Extract content from the page
      let content = '';
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: 'extractContent' });
        content = response?.content || '';
      } catch (error) {
        console.error('Error extracting content from page:', error);
        // If content script fails, try using scripting API as fallback
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.body.innerText
          });
          content = results[0]?.result || '';
        } catch (scriptError) {
          console.error('Error executing script:', scriptError);
          return '';
        }
      }
      
      if (!content || content.length < 200) {
        return '';
      }
      
      // Generate summary
      const summarizer = SummarizationService.getInstance();
      const summary = await summarizer.summarizeText(
        content, 
        config.summaryLength || 150
      );
      
      if (config.debugSummarization) {
        console.log('Generated summary for:', url);
        console.log('Summary:', summary);
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
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
            
            // Get the active tab to generate summary
            let summary = '';
            try {
              const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tabs.length > 0 && tabs[0].id && tabs[0].url === result.url) {
                summary = await this.generateSummary(tabs[0].id, result.url);
              }
            } catch (error) {
              console.error('Error getting active tab:', error);
            }
            
            await this.store.addEntry({
              visitId: `${latestVisit.visitId}`,
              url: result.url,
              title: result.title || '',
              visitTime: result.lastVisitTime || Date.now(),
              referringVisitId: latestVisit.referringVisitId?.toString() || '0',
              transition: latestVisit.transition,
              summary,
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