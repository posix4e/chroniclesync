import { HistoryItem, SyncStatus } from './types';

export class HistorySync {
  private apiUrl: string;
  private clientId: string;
  private maxRetries: number;
  private syncStatus: SyncStatus;

  constructor(apiUrl: string, clientId: string, maxRetries: number = 3) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.maxRetries = maxRetries;
    this.syncStatus = {
      lastSync: 0,
      status: 'idle'
    };
  }

  public async syncHistory(historyItems: HistoryItem[]): Promise<void> {
    if (this.syncStatus.status === 'syncing') {
      return;
    }

    this.syncStatus.status = 'syncing';
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        await this.sendHistoryToServer(historyItems);
        this.syncStatus = {
          lastSync: Date.now(),
          status: 'idle'
        };
        return;
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          this.syncStatus = {
            lastSync: Date.now(),
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  private async sendHistoryToServer(historyItems: HistoryItem[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': this.clientId
      },
      body: JSON.stringify({
        items: historyItems,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
}