import { BaseHistoryVisit, PlainHistoryVisit, EncryptedHistoryVisit } from '../services/SyncService';

interface BaseHistoryEntry extends BaseHistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface PlainHistoryEntry extends PlainHistoryVisit, BaseHistoryEntry {}

export interface EncryptedHistoryEntry extends EncryptedHistoryVisit, BaseHistoryEntry {}

export type HistoryEntry = PlainHistoryEntry | EncryptedHistoryEntry;

export function isPlainHistoryEntry(entry: HistoryEntry): entry is PlainHistoryEntry {
  return 'url' in entry && 'title' in entry && 'platform' in entry && 'browserName' in entry;
}

export function isEncryptedHistoryEntry(entry: HistoryEntry): entry is EncryptedHistoryEntry {
  return 'encryptedData' in entry && 'iv' in entry;
}