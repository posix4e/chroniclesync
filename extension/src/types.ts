export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitTime: number;
  visitId: string;
  referringVisitId: string;
  transition: string;
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  syncStatus: 'pending' | 'synced';
  lastModified: number;
  deleted?: boolean;
  summary?: {
    content: string;
    status: 'pending' | 'completed' | 'error';
    version: number;
    lastModified: number;
  };
}

export interface SyncResponse {
  history: HistoryEntry[];
  lastSyncTime: number;
  devices: DeviceInfo[];
}