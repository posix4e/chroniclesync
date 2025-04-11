import { HistoryStore } from './HistoryStore';
import { GunHistoryStore } from './GunHistoryStore';
import { getConfig } from '../../config';

// Define a common interface for both store implementations
export interface IHistoryStore {
  init(): Promise<void>;
  addEntry(entry: any): Promise<void>;
  getUnsyncedEntries(): Promise<any[]>;
  markAsSynced(visitId: string): Promise<void>;
  getEntries(deviceId?: string, since?: number): Promise<any[]>;
  mergeRemoteEntries(remoteEntries: any[]): Promise<void>;
  updateDevice(device: any): Promise<void>;
  getDevices(): Promise<any[]>;
  deleteEntry(visitId: string): Promise<void>;
  updatePageContent(url: string, pageContent: { content: string, summary: string }): Promise<void>;
  searchContent(query: string): Promise<any[]>;
}

export class HistoryStoreFactory {
  static async createHistoryStore(): Promise<IHistoryStore> {
    const config = await getConfig();
    
    // Check if useGunDB is enabled in settings
    if (config.useGunDB) {
      console.log('Using GunDB for history storage');
      return new GunHistoryStore();
    } else {
      console.log('Using IndexedDB for history storage');
      return new HistoryStore();
    }
  }
}