export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
  lastVisitTime: number;
  syncStatus: 'pending' | 'synced' | 'error';
}