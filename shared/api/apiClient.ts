import { HistoryEntry, DeviceInfo, SyncResponse } from '../models/types';

export interface ApiClientConfig {
  baseUrl: string;
  clientId: string;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  async syncHistory(entries: HistoryEntry[], lastSyncTime: number): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.config.clientId
        },
        body: JSON.stringify({
          history: entries,
          lastSyncTime,
          deviceInfo: this.getDeviceFromEntry(entries[0])
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing history:', error);
      throw error;
    }
  }

  private getDeviceFromEntry(entry: HistoryEntry): DeviceInfo {
    return {
      deviceId: entry.deviceId,
      platform: entry.platform,
      userAgent: entry.userAgent,
      browserName: entry.browserName,
      browserVersion: entry.browserVersion
    };
  }

  async registerDevice(device: DeviceInfo): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.config.clientId
        },
        body: JSON.stringify(device)
      });

      if (!response.ok) {
        throw new Error(`Device registration failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }
}