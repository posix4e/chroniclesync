import { HistoryVisit, EncryptedData } from '../services/SyncService';

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface EncryptedHistoryEntry extends Omit<HistoryEntry, 'url' | 'title'> {
  encryptedData: EncryptedData;
}