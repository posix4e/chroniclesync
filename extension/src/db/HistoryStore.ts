import { HistoryEntry } from '../types';
import { EncryptedHistoryEntry } from '../types/encryption';
import { EncryptionService } from '../services/Encryption';

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
        
        if (event.oldVersion < 2) {
          // Drop old store if exists
          if (db.objectStoreNames.contains(this.STORE_NAME)) {
            db.deleteObjectStore(this.STORE_NAME);
          }

          // Create new store with encrypted schema
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'visitId' });
          store.createIndex('visitTime', 'visitTime');
          store.createIndex('syncStatus', 'syncStatus');
          console.log('Created history store with encrypted schema');
        }
      };
    });
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const { encryptedUrl, encryptedTitle } = await this.encryptionService.encryptHistoryItem(
      entry.url,
      entry.title
    );

    const encryptedEntry: EncryptedHistoryEntry = {
      visitId: entry.visitId,
      encryptedUrl,
      encryptedTitle,
      visitTime: entry.visitTime,
      platform: entry.platform,
      browserName: entry.browserName,
      syncStatus: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
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
        const encryptedEntries: EncryptedHistoryEntry[] = request.result;
        Promise.all(
          encryptedEntries.map(async (entry) => {
            const { url, title } = await this.encryptionService.decryptHistoryItem(
              entry.encryptedUrl,
              entry.encryptedTitle
            );
            
            return {
              visitId: entry.visitId,
              url,
              title,
              visitTime: entry.visitTime,
              platform: entry.platform,
              browserName: entry.browserName,
              syncStatus: entry.syncStatus
            } as HistoryEntry;
          })
        ).then(resolve).catch(reject);
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
      const index = store.index('visitTime');
      const request = index.getAll(null, limit);

      request.onerror = () => {
        console.error('Error getting entries:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        const encryptedEntries: EncryptedHistoryEntry[] = request.result || [];
        Promise.all(
          encryptedEntries.map(async (entry) => {
            const { url, title } = await this.encryptionService.decryptHistoryItem(
              entry.encryptedUrl,
              entry.encryptedTitle
            );
            
            return {
              visitId: entry.visitId,
              url,
              title,
              visitTime: entry.visitTime,
              platform: entry.platform,
              browserName: entry.browserName,
              syncStatus: entry.syncStatus
            } as HistoryEntry;
          })
        ).then(decryptedEntries => {
          console.log('Retrieved and decrypted entries:', decryptedEntries.length);
          resolve(decryptedEntries);
        }).catch(error => {
          console.error('Error decrypting entries:', error);
          reject(error);
        });
      };
    });
  }
}