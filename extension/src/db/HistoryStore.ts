import { HistoryEntry, PlainHistoryEntry, EncryptedHistoryEntry } from '../types';
import { EncryptionService } from '../services/EncryptionService';
import { Settings } from '../settings/Settings';

export class HistoryStore {
  private readonly DB_NAME = 'chroniclesync';
  private readonly STORE_NAME = 'history';
  private db: IDBDatabase | null = null;
  private encryptionService: EncryptionService;

  constructor() {
    const settings = new Settings();
    this.encryptionService = new EncryptionService(settings);
  }

  async init(): Promise<void> {
    await this.encryptionService.init();
    return new Promise((resolve, reject) => {
      console.log('Initializing IndexedDB...');
      const request = indexedDB.open(this.DB_NAME, 2); // Increment version for schema update

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('IndexedDB opened successfully');
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Delete old store if exists
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
        }

        // Create new store with encrypted schema
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'visitId' });
        store.createIndex('visitTime', 'visitTime');
        store.createIndex('syncStatus', 'syncStatus');
        console.log('Created encrypted history store with indexes');
      };
    });
  }

  async addEntry(entry: Omit<PlainHistoryEntry, 'syncStatus'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Encrypt the sensitive data
    const sensitiveData = {
      url: entry.url,
      title: entry.title,
      platform: entry.platform,
      browserName: entry.browserName
    };

    const { ciphertext, iv } = await this.encryptionService.encrypt(JSON.stringify(sensitiveData));

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const encryptedEntry: EncryptedHistoryEntry = {
        visitId: entry.visitId,
        encryptedData: ciphertext,
        iv,
        visitTime: entry.visitTime,
        syncStatus: 'pending'
      };

      const request = store.put(encryptedEntry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        Promise.all(request.result.map((entry: EncryptedHistoryEntry) => 
          this.encryptionService.decrypt(entry.encryptedData, entry.iv)
            .then(decryptedData => {
              const sensitiveData = JSON.parse(decryptedData);
              return {
                visitId: entry.visitId,
                visitTime: entry.visitTime,
                syncStatus: entry.syncStatus,
                ...sensitiveData
              } as PlainHistoryEntry;
            })
        ))
          .then(resolve)
          .catch(reject);
      };
    });
  }

  async markAsSynced(visitId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(visitId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.syncStatus = 'synced';
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async getEntries(limit = 100): Promise<HistoryEntry[]> {
    if (!this.db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('visitTime');
      const request = index.getAll(null, limit);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        Promise.all((request.result || []).map((entry: EncryptedHistoryEntry) => 
          this.encryptionService.decrypt(entry.encryptedData, entry.iv)
            .then(decryptedData => {
              const sensitiveData = JSON.parse(decryptedData);
              return {
                visitId: entry.visitId,
                visitTime: entry.visitTime,
                syncStatus: entry.syncStatus,
                ...sensitiveData
              } as PlainHistoryEntry;
            })
        ))
          .then(resolve)
          .catch(reject);
      };
    });
  }
}