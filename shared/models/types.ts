// Shared types for both web and iOS extensions

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

export interface PageContent {
  content: string;
  summary: string;
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

// Interface for storage adapters
export interface StorageAdapter {
  init(): Promise<void>;
  addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void>;
  getUnsyncedEntries(): Promise<HistoryEntry[]>;
  markAsSynced(visitId: string): Promise<void>;
  getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]>;
  mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void>;
  updateDevice(device: DeviceInfo): Promise<void>;
  getDevices(): Promise<DeviceInfo[]>;
  deleteEntry(visitId: string): Promise<void>;
  updatePageContent(url: string, pageContent: { content: string, summary: string }): Promise<void>;
  searchContent(query: string): Promise<{ entry: HistoryEntry, matches: { text: string, context: string }[] }[]>;
}