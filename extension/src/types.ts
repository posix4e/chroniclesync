import { EncryptedData } from './utils/encryption';

export interface HistoryEntry {
  visitId: string;
  url: string | (EncryptedData & { encrypted: boolean });
  title: string | (EncryptedData & { encrypted: boolean });
  visitTime: number;
  platform: string;
  browserName: string;
  syncStatus?: 'pending' | 'synced' | 'error';
}

export interface HistoryVisit {
  visitId: string;
  url: string;
  title: string;
  visitTime: number;
  platform: string;
  browserName: string;
}

export interface EncryptedHistoryVisit {
  visitId: string;
  url: EncryptedData & { encrypted: boolean };
  title: EncryptedData & { encrypted: boolean };
  visitTime: number;
  platform: string;
  browserName: string;
}