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
  summary?: PageSummary;
}

export interface SyncResponse {
  history: HistoryEntry[];
  lastSyncTime: number;
  devices: DeviceInfo[];
}

export interface PageSummary {
  url: string;
  title: string;
  content: string;
  summary: string;
  timestamp: number;
  modelUsed: string;
}

export interface ContentExtractionResult {
  success: boolean;
  content: string;
  error?: string;
  selector?: string;
}

export interface SummarizationResult {
  success: boolean;
  summary: string;
  error?: string;
  modelUsed: string;
}