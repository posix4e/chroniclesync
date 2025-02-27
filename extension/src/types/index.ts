import { HistoryVisit } from '../services/SyncService';
import { SummaryData, SummaryStatus } from './summary';

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
  summary?: SummaryData;
  summaryStatus?: SummaryStatus;
  summaryError?: string;
  summaryLastModified?: number;
  summaryVersion?: number;
}