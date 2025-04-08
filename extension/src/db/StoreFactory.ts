import { HistoryStore } from './HistoryStore';
import { GunDBStore } from './GunDBStore';
import { Settings } from '../settings/Settings';

export class StoreFactory {
  private static instance: HistoryStore | GunDBStore | null = null;

  static async getStore(): Promise<HistoryStore | GunDBStore> {
    if (this.instance) {
      return this.instance;
    }

    const settings = new Settings();
    await settings.init();

    if (!settings.config) {
      throw new Error('Settings not initialized');
    }

    if (settings.config.storageType === 'gundb') {
      // Use GunDB
      const peers = settings.config.gundbPeers || [];
      this.instance = new GunDBStore(settings.config.clientId, peers);
    } else {
      // Use IndexedDB (default fallback)
      this.instance = new HistoryStore();
    }

    await this.instance.init();
    return this.instance;
  }

  static clearInstance(): void {
    this.instance = null;
  }
}