import { BaseHistoryVisit, PlainHistoryVisit, EncryptedHistoryVisit } from '../services/SyncService';

interface BaseHistoryEntry extends BaseHistoryVisit {
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface PlainHistoryEntry extends PlainHistoryVisit, BaseHistoryEntry {}

export interface EncryptedHistoryEntry extends EncryptedHistoryVisit, BaseHistoryEntry {}

export type HistoryEntry = PlainHistoryEntry | EncryptedHistoryEntry;