import { EncryptedHistoryVisit, HistoryEntry } from '../types';
import { EncryptionService } from '../services/EncryptionService';

export class HistoryStore {
  private encryptionService: EncryptionService | null = null;
  private readonly DB_NAME = 'chroniclesync';
  private readonly STORE_NAME = 'history';
  private db: IDBDatabase | null = null;

  setEncryptionService(service: EncryptionService) {
    this.encryptionService = service;
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
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'visitId' });
          store.createIndex('visitTime', 'visitTime');
          store.createIndex('syncStatus', 'syncStatus');
          store.createIndex('url', 'url');
          console.log('Created history store with indexes');
        }
      };
    });
  }

  private async encryptEntry(entry: Omit<HistoryEntry, 'syncStatus'>): Promise<EncryptedHistoryVisit> {
    if (!this.encryptionService) {
      throw new Error('Encryption service not initialized');
    }

    const urlEncrypted = await this.encryptionService.encrypt(entry.url);
    const titleEncrypted = await this.encryptionService.encrypt(entry.title);

    return {
      id: entry.visitId,
      url: urlEncrypted,
      title: titleEncrypted,
      visitTime: entry.visitTime,
      lastVisitTime: entry.lastVisitTime
    };
  }

  private async decryptEntry(entry: EncryptedHistoryVisit): Promise<Omit<HistoryEntry, 'syncStatus'>> {
    if (!this.encryptionService) {
      throw new Error('Encryption service not initialized');
    }

    const url = await this.encryptionService.decrypt(entry.url.ciphertext, entry.url.iv);
    const title = await this.encryptionService.decrypt(entry.title.ciphertext, entry.title.iv);

    return {
      visitId: entry.id,
      url,
      title,
      visitTime: entry.visitTime,
      lastVisitTime: entry.lastVisitTime
    };
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        let fullEntry: HistoryEntry;
        if (this.encryptionService) {
          const encryptedEntry = await this.encryptEntry(entry);
          fullEntry = {
            visitId: entry.visitId,
            url: entry.url,
            title: entry.title,
            visitTime: entry.visitTime,
            lastVisitTime: entry.lastVisitTime,
            syncStatus: 'pending',
            encrypted: true,
            encryptedData: encryptedEntry
          };
        } else {
          fullEntry = {
            ...entry,
            syncStatus: 'pending',
            encrypted: false
          };
        }

        const request = store.put(fullEntry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      } catch (error) {
        reject(error);
      }
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
      request.onsuccess = async () => {
        try {
          const entries = request.result;
          if (this.encryptionService) {
            // If entries are encrypted, decrypt them before returning
            for (const entry of entries) {
              if (entry.encrypted && entry.encryptedData) {
                const decrypted = await this.decryptEntry(entry.encryptedData);
                entry.url = decrypted.url;
                entry.title = decrypted.title;
              }
            }
          }
          resolve(entries);
        } catch (error) {
          reject(error);
        }
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
      request.onsuccess = async () => {
        try {
          const entries = request.result || [];
          if (this.encryptionService) {
            // If entries are encrypted, decrypt them before returning
            for (const entry of entries) {
              if (entry.encrypted && entry.encryptedData) {
                const decrypted = await this.decryptEntry(entry.encryptedData);
                entry.url = decrypted.url;
                entry.title = decrypted.title;
              }
            }
          }
          console.log('Retrieved and decrypted entries:', entries);
          resolve(entries);
        } catch (error) {
          console.error('Error decrypting entries:', error);
          reject(error);
        }
      };
    });
  }
}