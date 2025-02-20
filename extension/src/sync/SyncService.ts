import { StorageService } from '../storage/StorageService';
import { HistoryItem } from '../history/HistoryViewer';

interface SyncConfig {
  serverUrl: string;
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

interface DeviceInfo {
  platform: string;
  browserName: string;
  browserVersion: string;
  userAgent: string;
}

interface ServerHistoryItem {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  platform: string;
  browserName: string;
}

interface ServerSyncPayload {
  history: ServerHistoryItem[];
  deviceInfo: DeviceInfo;
}

export class SyncService {
  private storage: StorageService;
  private config: SyncConfig;
  private syncTimer: number | null = null;
  private retryCount: number = 0;
  private deviceInfo: DeviceInfo;

  constructor(storage: StorageService, config: Partial<SyncConfig> = {}) {
    this.storage = storage;
    this.config = {
      serverUrl: config.serverUrl || 'https://api.chroniclesync.com',
      syncInterval: config.syncInterval || 5 * 60 * 1000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 30 * 1000, // 30 seconds
    };

    // Initialize device info
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const browserInfo = this.getBrowserInfo();

    this.deviceInfo = {
      platform,
      browserName: browserInfo.name,
      browserVersion: browserInfo.version,
      userAgent
    };
  }

  private getBrowserInfo(): { name: string; version: string } {
    const ua = navigator.userAgent;
    let browserName = "unknown";
    let version = "unknown";

    if (ua.includes("Firefox/")) {
      browserName = "Firefox";
      version = ua.split("Firefox/")[1];
    } else if (ua.includes("Chrome/")) {
      browserName = "Chrome";
      version = ua.split("Chrome/")[1].split(" ")[0];
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
      browserName = "Safari";
      version = ua.split("Version/")[1].split(" ")[0];
    } else if (ua.includes("Edg/")) {
      browserName = "Edge";
      version = ua.split("Edg/")[1];
    }

    return { name: browserName, version };
  }

  async start(): Promise<void> {
    await this.storage.init();
    await this.sync();
    this.scheduleNextSync();
  }

  stop(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private scheduleNextSync(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    this.syncTimer = window.setTimeout(() => this.sync(), this.config.syncInterval);
  }

  async sync(): Promise<void> {
    try {
      const clientId = await this.getClientId();
      if (!clientId) {
        throw new Error('No client ID available');
      }

      // Get all local items that need to be synced
      const pendingItems = await this.storage.getItemsByStatus('pending');
      const errorItems = await this.storage.getItemsByStatus('error');
      const itemsToSync = [...pendingItems, ...errorItems];

      // Convert local items to server format
      const serverHistory: ServerHistoryItem[] = itemsToSync.map(item => ({
        visitId: item.id,
        url: item.url,
        title: item.title,
        visitTime: item.timestamp,
        platform: this.deviceInfo.platform,
        browserName: this.deviceInfo.browserName
      }));

      // Prepare sync payload
      const payload: ServerSyncPayload = {
        history: serverHistory,
        deviceInfo: this.deviceInfo
      };

      // Send data to server
      const response = await fetch(`${this.config.serverUrl}/client?clientId=${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Mark items as synced
      await Promise.all(
        itemsToSync.map(item => this.storage.updateSyncStatus(item.id, 'synced'))
      );

      // Fetch latest data from server
      await this.fetchLatestData(clientId);

      this.retryCount = 0;
      this.scheduleNextSync();
    } catch (error) {
      console.error('Sync failed:', error);
      this.retryCount++;

      if (this.retryCount <= this.config.retryAttempts) {
        setTimeout(() => this.sync(), this.config.retryDelay);
      } else {
        await this.markItemsAsError();
      }
    }
  }

  private async fetchLatestData(clientId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.serverUrl}/client?clientId=${clientId}&page=1&pageSize=1000`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const serverItems = data.history.map((item: ServerHistoryItem) => ({
        id: item.visitId,
        url: item.url,
        title: item.title,
        timestamp: item.visitTime,
        syncStatus: 'synced' as const
      }));

      // Update local storage with server data
      for (const item of serverItems) {
        await this.storage.addHistoryItem(item);
      }
    } catch (error) {
      console.error('Failed to fetch latest data:', error);
      throw error;
    }
  }

  private async markItemsAsError(): Promise<void> {
    const pendingItems = await this.storage.getItemsByStatus('pending');
    await Promise.all(
      pendingItems.map(item => this.storage.updateSyncStatus(item.id, 'error'))
    );
  }

  private async getClientId(): Promise<string> {
    const stored = await chrome.storage.local.get('clientId');
    if (stored.clientId) {
      return stored.clientId;
    }

    // Generate a new client ID if none exists
    const clientId = 'cs_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    await chrome.storage.local.set({ clientId });
    return clientId;
  }
}