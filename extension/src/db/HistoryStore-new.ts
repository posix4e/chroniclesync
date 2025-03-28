import { HistoryEntry, DeviceInfo } from '../types';
import { HistoryRepository } from './HistoryRepository';
import { DeviceRepository } from './DeviceRepository';

/**
 * Facade for history and device operations
 * This class maintains backward compatibility while delegating to specialized repositories
 */
export class HistoryStore {
  private historyRepository: HistoryRepository;
  private deviceRepository: DeviceRepository;
  private initialized = false;
  
  constructor() {
    this.historyRepository = new HistoryRepository();
    this.deviceRepository = new DeviceRepository();
  }
  
  /**
   * Initializes the store
   */
  async init(): Promise<void> {
    if (!this.initialized) {
      await Promise.all([
        this.historyRepository.init(),
        this.deviceRepository.init()
      ]);
      this.initialized = true;
    }
  }
  
  /**
   * Adds a history entry
   */
  async addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void> {
    await this.historyRepository.addEntry(entry);
  }
  
  /**
   * Gets unsynced entries
   */
  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    return this.historyRepository.getUnsyncedEntries();
  }
  
  /**
   * Marks an entry as synced
   */
  async markAsSynced(visitId: string): Promise<void> {
    await this.historyRepository.markAsSynced(visitId);
  }
  
  /**
   * Gets entries by device ID and since time
   */
  async getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]> {
    return this.historyRepository.getEntries(deviceId, since);
  }
  
  /**
   * Deletes an entry
   */
  async deleteEntry(visitId: string): Promise<void> {
    await this.historyRepository.deleteEntry(visitId);
  }
  
  /**
   * Updates page content for a URL
   */
  async updatePageContent(url: string, content: { content?: string, summary?: string }): Promise<void> {
    await this.historyRepository.updatePageContent(url, content);
  }
  
  /**
   * Merges remote entries
   */
  async mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void> {
    await this.historyRepository.mergeRemoteEntries(remoteEntries);
  }
  
  /**
   * Updates device information
   */
  async updateDevice(deviceInfo: DeviceInfo): Promise<void> {
    await this.deviceRepository.updateDevice(deviceInfo);
  }
  
  /**
   * Gets all devices
   */
  async getDevices(): Promise<DeviceInfo[]> {
    return this.deviceRepository.getDevices();
  }
  
  /**
   * Searches content
   */
  async searchContent(query: string): Promise<{ entry: HistoryEntry, matches: string[] }[]> {
    return this.historyRepository.searchContent(query);
  }
}