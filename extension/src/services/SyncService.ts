import { Settings } from '../settings/Settings';

export interface DeviceInfo {
  platform: string;
  browserName: string;
  browserVersion: string;
  userAgent: string;
}

export interface SummaryData {
  content: string;
  status: 'completed' | 'error';
  error?: string;
  lastModified: number;
  version: number;
}

export interface HistoryVisit {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  platform: string;
  browserName: string;
  summary?: SummaryData;
  summaryStatus?: 'pending' | 'completed' | 'error';
  summaryError?: string;
  summaryLastModified?: number;
  summaryVersion?: number;
}

export interface SyncPayload {
  history: HistoryVisit[];
  deviceInfo: DeviceInfo;
}

export class SyncService {
  private settings: Settings;
  private deviceInfo: DeviceInfo;

  constructor(settings: Settings) {
    this.settings = settings;
    this.deviceInfo = this.getDeviceInfo();
  }

  private getDeviceInfo(): DeviceInfo {
    const platform = navigator.platform;
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Parse browser name and version
    if (ua.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edge')) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return {
      platform,
      browserName,
      browserVersion,
      userAgent: ua
    };
  }

  async syncHistory(history: HistoryVisit[]): Promise<void> {
    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    // Prepare history entries with summaries
    const historyWithSummaries = history.map(entry => {
      if (entry.summaryStatus === 'completed' && entry.summary) {
        return {
          ...entry,
          summary: {
            content: entry.summary.content,
            status: entry.summary.status,
            error: entry.summary.error,
            lastModified: entry.summaryLastModified || Date.now(),
            version: entry.summaryVersion || 1
          }
        };
      }
      return entry;
    });

    const payload: SyncPayload = {
      history: historyWithSummaries,
      deviceInfo: this.deviceInfo
    };

    console.log('Syncing history with payload:', payload);

    const response = await fetch(`${apiUrl}/history/sync?clientId=${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Sync failed:', error);
      throw new Error(`Sync failed: ${error}`);
    }

    const result = await response.json();
    console.log('Sync successful:', result);
  }

  async syncSummaries(since?: number): Promise<void> {
    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    // Get summaries modified since the last sync
    const response = await fetch(
      `${apiUrl}/summaries?clientId=${clientId}${since ? `&since=${since}` : ''}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get summaries:', error);
      throw new Error(`Failed to get summaries: ${error}`);
    }

    const result = await response.json();
    return result.summaries || [];
  }

  async getHistory(page = 1, pageSize = 50): Promise<HistoryVisit[]> {
    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    const response = await fetch(
      `${apiUrl}/history?clientId=${clientId}&page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get history:', error);
      throw new Error(`Failed to get history: ${error}`);
    }

    const result = await response.json();
    return result.history || [];
  }
}