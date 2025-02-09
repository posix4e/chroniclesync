export interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  deviceId: string;
  os: string;
  browser: string;
  version: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  lastSync?: number;
  error?: string;
}

export interface HistoryManagerConfig {
  clientId: string;
  syncInterval: number;
  maxRetries: number;
}