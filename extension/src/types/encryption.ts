export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface EncryptedHistoryEntry {
  visitId: string;
  encryptedUrl: EncryptedData;
  encryptedTitle: EncryptedData;
  visitTime: number;
  platform: string;
  browserName: string;
  syncStatus: 'pending' | 'synced' | 'error';
}