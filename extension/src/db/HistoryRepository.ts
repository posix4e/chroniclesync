import { DatabaseService, StoreConfig } from './DatabaseService';
import { HistoryEntry } from '../types';

/**
 * Repository for managing history entries
 */
export class HistoryRepository {
  private readonly STORE_NAME = 'history';
  private dbService: DatabaseService;
  
  constructor() {
    const storeConfigs: StoreConfig[] = [
      {
        name: this.STORE_NAME,
        keyPath: 'visitId',
        indexes: [
          { name: 'visitTime', keyPath: 'visitTime' },
          { name: 'syncStatus', keyPath: 'syncStatus' },
          { name: 'url', keyPath: 'url' },
          { name: 'deviceId', keyPath: 'deviceId' },
          { name: 'lastModified', keyPath: 'lastModified' }
        ],
        upgradeCallback: (db, oldVersion, event) => {
          // Add content index for version 3
          if (oldVersion < 3) {
            if (db.objectStoreNames.contains(this.STORE_NAME)) {
              const transaction = event.target as IDBOpenDBRequest;
              const historyStore = transaction.transaction?.objectStore(this.STORE_NAME);
              
              if (historyStore && !historyStore.indexNames.contains('hasContent')) {
                historyStore.createIndex('hasContent', 'pageContent', { unique: false });
                console.log('Added page content index');
              }
            }
          }
        }
      }
    ];
    
    this.dbService = new DatabaseService('chroniclesync', 3, storeConfigs);
  }
  
  /**
   * Initializes the repository
   */
  async init(): Promise<void> {
    await this.dbService.init();
  }
  
  /**
   * Adds a history entry
   */
  async addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void> {
    const fullEntry: HistoryEntry = {
      ...entry,
      syncStatus: 'pending',
      lastModified: Date.now()
    };
    
    await this.dbService.add(this.STORE_NAME, fullEntry);
  }
  
  /**
   * Gets unsynced entries
   */
  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    return this.dbService.getByIndex(this.STORE_NAME, 'syncStatus', 'pending');
  }
  
  /**
   * Marks an entry as synced
   */
  async markAsSynced(visitId: string): Promise<void> {
    const entry = await this.dbService.get<HistoryEntry>(this.STORE_NAME, visitId);
    
    if (entry) {
      entry.syncStatus = 'synced';
      entry.lastModified = Date.now();
      await this.dbService.update(this.STORE_NAME, entry);
    }
  }
  
  /**
   * Gets entries by device ID and since time
   */
  async getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]> {
    let entries: HistoryEntry[];
    
    if (deviceId) {
      entries = await this.dbService.getByIndex(this.STORE_NAME, 'deviceId', deviceId);
    } else {
      entries = await this.dbService.getAll(this.STORE_NAME);
    }
    
    if (since) {
      return entries.filter(entry => entry.visitTime >= since);
    }
    
    return entries;
  }
  
  /**
   * Deletes an entry
   */
  async deleteEntry(visitId: string): Promise<void> {
    await this.dbService.delete(this.STORE_NAME, visitId);
  }
  
  /**
   * Updates page content for a URL
   */
  async updatePageContent(url: string, content: { content?: string, summary?: string }): Promise<void> {
    const entries = await this.dbService.getByIndex<HistoryEntry>(this.STORE_NAME, 'url', url);
    
    for (const entry of entries) {
      entry.pageContent = {
        ...(entry.pageContent || {}),
        ...content,
        extractedAt: Date.now()
      };
      entry.lastModified = Date.now();
      entry.syncStatus = 'pending'; // Mark for sync
      
      await this.dbService.update(this.STORE_NAME, entry);
    }
  }
  
  /**
   * Merges remote entries
   */
  async mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void> {
    for (const remoteEntry of remoteEntries) {
      const localEntry = await this.dbService.get<HistoryEntry>(this.STORE_NAME, remoteEntry.visitId);
      
      if (!localEntry) {
        // New entry, add it
        await this.dbService.add(this.STORE_NAME, {
          ...remoteEntry,
          syncStatus: 'synced',
          lastModified: Date.now()
        });
      } else if (remoteEntry.lastModified > localEntry.lastModified) {
        // Remote entry is newer, update local
        await this.dbService.update(this.STORE_NAME, {
          ...localEntry,
          ...remoteEntry,
          syncStatus: 'synced',
          lastModified: Date.now()
        });
      }
    }
  }
  
  /**
   * Searches content
   */
  async searchContent(query: string): Promise<{ entry: HistoryEntry, matches: string[] }[]> {
    const entries = await this.dbService.getAll<HistoryEntry>(this.STORE_NAME);
    const results: { entry: HistoryEntry, matches: string[] }[] = [];
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    for (const entry of entries) {
      const matches: string[] = [];
      
      // Search in title
      if (entry.title && entry.title.toLowerCase().includes(query.toLowerCase())) {
        matches.push(`Title: ${entry.title}`);
      }
      
      // Search in URL
      if (entry.url && entry.url.toLowerCase().includes(query.toLowerCase())) {
        matches.push(`URL: ${entry.url}`);
      }
      
      // Search in page content
      if (entry.pageContent?.content) {
        const content = entry.pageContent.content.toLowerCase();
        
        for (const term of searchTerms) {
          if (content.includes(term)) {
            // Extract a snippet around the match
            const index = content.indexOf(term);
            const start = Math.max(0, index - 40);
            const end = Math.min(content.length, index + term.length + 40);
            const snippet = '...' + content.substring(start, end) + '...';
            
            matches.push(`Content: ${snippet}`);
            break;
          }
        }
      }
      
      // Search in summary
      if (entry.pageContent?.summary && entry.pageContent.summary.toLowerCase().includes(query.toLowerCase())) {
        matches.push(`Summary: ${entry.pageContent.summary}`);
      }
      
      if (matches.length > 0) {
        results.push({ entry, matches });
      }
    }
    
    return results;
  }
}