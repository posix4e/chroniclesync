export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

export interface PageContent {
  content: string; // This will ALWAYS be empty in storage, NEVER stored or synced, only used locally for summary generation
  summary: string; // Only the summary is stored and searched
  extractedAt: number;
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
  pageContent?: PageContent;
}

export interface SyncResponse {
  history: HistoryEntry[];
  lastSyncTime: number;
  devices: DeviceInfo[];
}

export interface SearchResult {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  matches: {
    text: string;
    context: string;
  }[];
}