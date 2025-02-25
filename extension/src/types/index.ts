export interface HistoryVisit {
  visitId: string;
  platform: string;
  browserName: string;
  encryptedData: string;
}

export interface HistoryEntry extends HistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}