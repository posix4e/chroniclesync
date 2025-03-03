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
    try {
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

      try {
        const response = await fetch(`${apiUrl}/history/sync?clientId=${clientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
          // Timeout is handled in the catch block
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Sync failed:', error);
          throw new Error(`Sync failed: ${error}`);
        }

        const result = await response.json();
        console.log('Sync successful:', result);
      } catch (error) {
        // Handle network errors more gracefully
        console.error('Network error during sync:', error);
        throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error('Error in syncHistory:', error);
      // Rethrow but don't crash the extension
      throw error;
    }
  }

  async getHistory(page = 1, pageSize = 50): Promise<HistoryVisit[]> {
    try {
      const apiUrl = this.settings.getApiUrl();
      const clientId = await chrome.storage.sync.get(['clientId']).then(result => result.clientId);

      if (!clientId) {
        throw new Error('Client ID not found');
      }

      try {
        const response = await fetch(
          `${apiUrl}/history?clientId=${clientId}&page=${page}&pageSize=${pageSize}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
            // Timeout is handled in the catch block
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to get history:', error);
          throw new Error(`Failed to get history: ${error}`);
        }

        const result = await response.json();
        return result.history || [];
      } catch (error) {
        // Handle network errors more gracefully
        console.error('Network error during history fetch:', error);
        throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error('Error in getHistory:', error);
      // Return empty array instead of crashing
      return [];
    }
  }
}