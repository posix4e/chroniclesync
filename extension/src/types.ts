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
  pageContent?: string;
  pageSummary?: string;
  contentEmbedding?: number[];
}

export interface SyncResponse {
  history: HistoryEntry[];
  lastSyncTime: number;
  devices: DeviceInfo[];
}