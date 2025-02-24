import { HistoryVisit } from '../services/SyncService';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
}

export interface EncryptedHistoryVisit {
  id: string;
  url: EncryptedData;
  title: EncryptedData;
  visitTime: number;
  lastVisitTime: number;
}

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
  encrypted?: boolean;
  encryptedData?: EncryptedHistoryVisit;
}