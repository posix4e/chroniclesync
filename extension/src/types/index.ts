import { HistoryVisit } from '../services/SyncService';

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface EncryptedHistoryEntry {
  visitId: string;
  encryptedData: string;
  iv: string;
  visitTime: number;
  syncStatus: 'pending' | 'synced' | 'error';
}