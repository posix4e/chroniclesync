import { Settings } from '../settings/Settings';
import { EncryptionService } from './Encryption';
import { EncryptedHistoryEntry } from '../types/encryption';

export interface DeviceInfo {
  platform: string;
  browserName: string;
  browserVersion: string;
  userAgent: string;
}

export interface HistoryVisit {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  platform: string;
  browserName: string;
}

export interface SyncPayload {
  history: EncryptedHistoryEntry[];
  deviceInfo: DeviceInfo;
}

export interface SyncResponse {
  success: boolean;
  syncedEntries: string[]; // Array of visitIds that were successfully synced
  message?: string;
}

export class SyncService {
  private settings: Settings;
  private deviceInfo: DeviceInfo;
  private encryptionService: EncryptionService;

  constructor(settings: Settings, encryptionService: EncryptionService) {
    this.settings = settings;
    this.encryptionService = encryptionService;
    this.deviceInfo = this.getDeviceInfo();
  }

  private getDeviceInfo(): DeviceInfo {
    const platform = navigator.platform;
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

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

  async syncHistory(history: HistoryVisit[]): Promise<string[]> {
    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    // Encrypt history items before syncing
    const encryptedHistory = await Promise.all(
      history.map(async (entry) => {
        const { encryptedUrl, encryptedTitle } = await this.encryptionService.encryptHistoryItem(
          entry.url,
          entry.title
        );

        return {
          visitId: entry.visitId,
          encryptedUrl,
          encryptedTitle,
          visitTime: entry.visitTime,
          platform: entry.platform,
          browserName: entry.browserName,
          syncStatus: 'pending' as const
        };
      })
    );

    const payload: SyncPayload = {
      history: encryptedHistory,
      deviceInfo: this.deviceInfo
    };

    console.log('Syncing encrypted history');

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

    const result = await response.json() as SyncResponse;
    console.log('Sync successful:', result.message || 'No additional details');
    
    if (!result.success) {
      throw new Error(`Sync completed but server reported failure: ${result.message}`);
    }
    
    return result.syncedEntries;
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
    const encryptedHistory: EncryptedHistoryEntry[] = result.history || [];

    // Decrypt history items
    const decryptedHistory = await Promise.all(
      encryptedHistory.map(async (entry) => {
        const { url, title } = await this.encryptionService.decryptHistoryItem(
          entry.encryptedUrl,
          entry.encryptedTitle
        );

        return {
          visitId: entry.visitId,
          url,
          title,
          visitTime: entry.visitTime,
          platform: entry.platform,
          browserName: entry.browserName
        };
      })
    );

    return decryptedHistory;
  }
}