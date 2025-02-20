import { HistoryItem } from '../types/history';

interface SyncStatus {
  lastSync: Date;
  isOnline: boolean;
  isSyncing: boolean;
  error?: string;
}

export class BidirectionalSyncService {
  private static instance: BidirectionalSyncService;
  private syncStatus: SyncStatus;
  private localHistory: Map<string, HistoryItem>;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes
  private syncTimer?: number;

  private constructor() {
    this.syncStatus = {
      lastSync: new Date(0),
      isOnline: navigator.onLine,
      isSyncing: false
    };
    this.localHistory = new Map();
    this.initializeListeners();
  }

  static getInstance(): BidirectionalSyncService {
    if (!BidirectionalSyncService.instance) {
      BidirectionalSyncService.instance = new BidirectionalSyncService();
    }
    return BidirectionalSyncService.instance;
  }

  private initializeListeners() {
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
  }

  private async handleOnlineStatusChange(isOnline: boolean) {
    this.syncStatus.isOnline = isOnline;
    if (isOnline) {
      await this.sync();
    }
  }

  async startPeriodicSync() {
    await this.sync();
    this.syncTimer = window.setInterval(() => this.sync(), this.syncInterval);
  }

  stopPeriodicSync() {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
    }
  }

  async sync(): Promise<void> {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return;
    }

    try {
      this.syncStatus.isSyncing = true;
      this.syncStatus.error = undefined;

      // Get local changes since last sync
      const localChanges = await this.getLocalChangesSinceLastSync();

      // Get remote changes
      const remoteChanges = await this.fetchRemoteChanges();

      // Merge changes
      const mergedHistory = this.mergeChanges(localChanges, remoteChanges);

      // Update local storage
      await this.updateLocalStorage(mergedHistory);

      // Push merged changes to server
      await this.pushToServer(mergedHistory);

      this.syncStatus.lastSync = new Date();
      this.notifyListeners('sync-complete', { success: true });
    } catch (error) {
      this.syncStatus.error = error.message;
      this.notifyListeners('sync-error', { error });
      console.error('Sync failed:', error);
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  private async getLocalChangesSinceLastSync(): Promise<HistoryItem[]> {
    return new Promise((resolve) => {
      chrome.history.search({
        text: '',
        startTime: this.syncStatus.lastSync.getTime(),
        maxResults: 1000
      }, (items) => {
        resolve(items.map(item => ({
          ...item,
          lastVisitTime: new Date(item.lastVisitTime).toISOString()
        })));
      });
    });
  }

  private async fetchRemoteChanges(): Promise<HistoryItem[]> {
    const response = await fetch(`${process.env.API_URL}/history/changes`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch remote changes: ${response.statusText}`);
    }

    return await response.json();
  }

  private mergeChanges(local: HistoryItem[], remote: HistoryItem[]): HistoryItem[] {
    const merged = new Map<string, HistoryItem>();

    // Add local items
    local.forEach(item => {
      merged.set(item.url, item);
    });

    // Merge remote items, newer timestamps take precedence
    remote.forEach(item => {
      const existingItem = merged.get(item.url);
      if (!existingItem || new Date(item.lastVisitTime) > new Date(existingItem.lastVisitTime)) {
        merged.set(item.url, item);
      }
    });

    return Array.from(merged.values());
  }

  private async updateLocalStorage(history: HistoryItem[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ history }, resolve);
    });
  }

  private async pushToServer(history: HistoryItem[]): Promise<void> {
    const response = await fetch(`${process.env.API_URL}/history/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify({ history })
    });

    if (!response.ok) {
      throw new Error(`Failed to push changes to server: ${response.statusText}`);
    }
  }

  private async getAuthToken(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get('authToken', (result) => {
        resolve(result.authToken);
      });
    });
  }

  private notifyListeners(event: string, data: any) {
    chrome.runtime.sendMessage({
      type: 'sync-event',
      event,
      data
    });
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async getLocalHistory(): Promise<HistoryItem[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get('history', (result) => {
        resolve(result.history || []);
      });
    });
  }
}