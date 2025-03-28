import type { DeviceInfo, PageContent } from '../../shared/types';

export type { DeviceInfo, PageContent };

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