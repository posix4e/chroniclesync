import { Settings } from '../settings/Settings';

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
  history: HistoryVisit[];
  deviceInfo: DeviceInfo;
}

export class SyncService {
  private settings: Settings;
  private deviceInfo: DeviceInfo;

  constructor(settings: Settings) {
    this.settings = settings;
    this.deviceInfo = {
      platform: 'unknown',
      browserName: 'Chrome',
      browserVersion: 'unknown',
      userAgent: 'Chrome Extension'
    };
    this.initDeviceInfo();
  }

  private async initDeviceInfo(): Promise<void> {
    this.deviceInfo = await this.getDeviceInfo();
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    // Get platform info from chrome.runtime API
    const platform = await chrome.runtime.getPlatformInfo();

    // Get browser version from chrome.runtime API
    const version = chrome.runtime.getManifest().version;

    return {
      platform: platform.os,
      browserName: 'Chrome',
      browserVersion: version,
      userAgent: 'Chrome Extension'
    };
  }

  async syncHistory(history: HistoryVisit[]): Promise<void> {
    const apiUrl = this.settings.getApiUrl();
    const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

    if (!clientId) {
      throw new Error('Client ID not found');
    }

    const payload: SyncPayload = {
      history,
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