import { HistoryItem, HistoryManagerConfig } from './types';
import { DeviceInfoManager } from './DeviceInfo';
import { HistorySync } from './HistorySync';

export class HistoryManager {
  private static instance: HistoryManager;
  private config: HistoryManagerConfig;
  private deviceInfoManager: DeviceInfoManager;
  private historySync: HistorySync;
  private historyQueue: HistoryItem[] = [];
  private syncTimeout: NodeJS.Timeout | null = null;

  private constructor(config: HistoryManagerConfig) {
    this.config = config;
    this.deviceInfoManager = DeviceInfoManager.getInstance();
    this.historySync = new HistorySync(
      config.apiUrl,
      config.clientId,
      config.maxRetries
    );
    this.initHistoryListener();
  }

  public static getInstance(config?: HistoryManagerConfig): HistoryManager {
    if (!HistoryManager.instance && config) {
      HistoryManager.instance = new HistoryManager(config);
    } else if (!HistoryManager.instance) {
      throw new Error('HistoryManager must be initialized with config first');
    }
    return HistoryManager.instance;
  }

  private initHistoryListener(): void {
    chrome.history.onVisited.addListener(async (result) => {
      const deviceInfo = await this.deviceInfoManager.getDeviceInfo();
      if (!result.url) {
        console.error('History item missing URL:', result);
        return;
      }

      const historyItem: HistoryItem = {
        url: result.url,
        title: result.title || '',
        visitTime: result.lastVisitTime || Date.now(),
        deviceInfo
      };

      this.historyQueue.push(historyItem);
      this.scheduleSyncIfNeeded();
    });
  }

  private scheduleSyncIfNeeded(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      if (this.historyQueue.length > 0) {
        const itemsToSync = [...this.historyQueue];
        this.historyQueue = [];
        
        try {
          await this.historySync.syncHistory(itemsToSync);
        } catch (error) {
          this.historyQueue.unshift(...itemsToSync);
          console.error('Failed to sync history:', error);
        }
      }
    }, this.config.syncInterval);
  }

  public async forceSyncHistory(): Promise<void> {
    if (this.historyQueue.length > 0) {
      const itemsToSync = [...this.historyQueue];
      this.historyQueue = [];
      await this.historySync.syncHistory(itemsToSync);
    }
  }

  public getSyncStatus() {
    return this.historySync.getSyncStatus();
  }

  public updateConfig(config: Partial<HistoryManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.historySync = new HistorySync(
      this.config.apiUrl,
      this.config.clientId,
      this.config.maxRetries
    );
  }
}