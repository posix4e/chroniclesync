import { HistoryVisit } from '../services/SyncService';

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}