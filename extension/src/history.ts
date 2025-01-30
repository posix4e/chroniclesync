import { config } from './config';

interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  clientId?: string;
}

class HistoryManager {
  private clientId: string | null = null;
  private uploadQueue: HistoryEntry[] = [];
  private isUploading = false;

  setClientId(id: string) {
    this.clientId = id;
    chrome.storage.local.set({ clientId: id });
  }

  async getClientId(): Promise<string | null> {
    const result = await chrome.storage.local.get(['clientId']);
    return result.clientId || null;
  }

  async addToHistory(url: string, title: string) {
    const entry: HistoryEntry = {
      url,
      title,
      timestamp: Date.now(),
      clientId: this.clientId || undefined
    };

    this.uploadQueue.push(entry);
    this.tryUpload();
  }

  private async tryUpload() {
    if (this.isUploading || !this.clientId || this.uploadQueue.length === 0) {
      return;
    }

    this.isUploading = true;
    const entries = [...this.uploadQueue];
    this.uploadQueue = [];

    try {
      const response = await fetch(`${config.workerUrl}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          entries
        })
      });

      if (!response.ok) {
        this.uploadQueue.unshift(...entries);
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to upload history:', error);
      this.uploadQueue.unshift(...entries);
    } finally {
      this.isUploading = false;
      if (this.uploadQueue.length > 0) {
        setTimeout(() => this.tryUpload(), 5000); // Retry after 5 seconds
      }
    }
  }
}

export const historyManager = new HistoryManager();