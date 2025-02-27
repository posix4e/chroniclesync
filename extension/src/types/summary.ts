export type SummaryStatus = 'pending' | 'completed' | 'error';

export interface SummaryData {
  text: string;
  version: number;
  lastModified: number;
}

export interface SummaryConfig {
  enabled: boolean;
  maxLength: number;
  minLength: number;
  model: string;
}

// Extend the existing HistoryEntry interface
declare global {
  interface HistoryEntry {
    summary?: SummaryData;
    summaryStatus?: SummaryStatus;
    summaryError?: string;
    summaryLastModified?: number;
    summaryVersion?: number;
  }
}