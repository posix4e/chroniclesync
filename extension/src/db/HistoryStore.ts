import { HistoryEntry } from '../types';
import { EncryptionService } from '../services/EncryptionService';

export class HistoryStore {
  private readonly DB_NAME = 'chroniclesync';
  private readonly STORE_NAME = 'history';
  private db: IDBDatabase | null = null;
  private encryptionService: EncryptionService;

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Initializing IndexedDB...');
      const request = indexedDB.open(this.DB_NAME, 1);

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
        
        // Delete old store if it exists
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
        }
        
        // Create new store with updated schema
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'visitId' });
        store.createIndex('syncStatus', 'syncStatus');
        console.log('Created history store with updated schema for encrypted data');
      };
    });
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Encrypt sensitive data
    const encryptedData = await this.encryptionService.encrypt(
      JSON.stringify({
        url: entry.url,
        title: entry.title,
        visitTime: entry.visitTime
      })
    );

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const fullEntry: HistoryEntry = {
        visitId: entry.visitId,
        platform: entry.platform,
        browserName: entry.browserName,
        encryptedData,
        syncStatus: 'pending'
      } as any; // Type assertion since we're changing the structure

      const request = store.put(fullEntry);
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
        const entries = request.result.map(entry => ({
          visitId: entry.visitId,
          platform: entry.platform,
          browserName: entry.browserName,
          encryptedData: entry.encryptedData,
          syncStatus: entry.syncStatus
        }));
        resolve(entries);
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
      console.log('Getting history entries...');
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll(null, limit);

      request.onerror = () => {
        console.error('Error getting entries:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('Retrieved entries:', request.result?.length || 0);
        resolve(request.result || []);
      };
    });
  }
}