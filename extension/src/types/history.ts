export type SummaryStatus = 'pending' | 'completed' | 'error';

export interface SummaryData {
  content: string;
  status: 'completed' | 'error';
  version: number;
  lastModified: number;
}

export interface HistoryEntry {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  lastModified: number;
  version: number;
  summary?: SummaryData;
  summaryStatus?: SummaryStatus;
  summaryError?: string;
  summaryLastModified?: number;
  summaryVersion?: number;
  syncStatus?: 'pending' | 'synced';
  deleted?: boolean;
  referringVisitId?: string;
  transition?: string;
  deviceId?: string;
  platform?: string;
  browserName?: string;
  browserVersion?: string;
  userAgent?: string;
}