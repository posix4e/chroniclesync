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
  summary?: string;
}

export interface SyncResponse {
  history: HistoryEntry[];
  lastSyncTime: number;
  devices: DeviceInfo[];
}

export interface PageContent {
  url: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface PageSummary {
  url: string;
  title: string;
  summary: string;
  timestamp: number;
  contentLength: number;
}

export interface SummarizationRequest {
  type: 'summarizeContent';
  url: string;
  title: string;
  content: string;
}

export interface SummarizationResponse {
  type: 'summarizationComplete';
  url: string;
  summary: string;
  success: boolean;
  error?: string;
}