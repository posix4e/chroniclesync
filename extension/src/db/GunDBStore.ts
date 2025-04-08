import Gun from 'gun';
import { HistoryEntry, DeviceInfo } from '../types';

export class GunDBStore {
  private readonly DB_NAME = 'chroniclesync';
  private gun: any;
  private historyRef: any;
  private devicesRef: any;
  private clientId: string;

  constructor(clientId: string, peers: string[] = []) {
    this.clientId = clientId;
    // Initialize Gun with optional peers for P2P sync
    this.gun = Gun({
      peers: peers,
      localStorage: false, // Use IndexedDB instead of localStorage
      radisk: true, // Enable disk persistence
    });
    
    // Create references to our data
    this.historyRef = this.gun.get(`${this.DB_NAME}_${clientId}`).get('history');
    this.devicesRef = this.gun.get(`${this.DB_NAME}_${clientId}`).get('devices');
  }

  async init(): Promise<void> {
    console.log('Initializing GunDB...');
    // GunDB doesn't require explicit initialization like IndexedDB
    return Promise.resolve();
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void> {
    return new Promise((resolve) => {
      const fullEntry: HistoryEntry = {
        ...entry,
        syncStatus: 'synced', // In GunDB, data is automatically synced
        lastModified: Date.now()
      };

      // Store the entry using visitId as the key
      this.historyRef.get(entry.visitId).put(fullEntry, (ack: any) => {
        if (ack.err) {
          console.error('Error adding entry to GunDB:', ack.err);
        }
        resolve();
      });
    });
  }

  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    // In GunDB, all data is automatically synced, so this is just for compatibility
    return Promise.resolve([]);
  }

  async markAsSynced(visitId: string): Promise<void> {
    // In GunDB, all data is automatically synced, so this is just for compatibility
    return Promise.resolve();
  }

  async getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]> {
    return new Promise((resolve) => {
      const entries: HistoryEntry[] = [];
      
      this.historyRef.map().once((data: HistoryEntry, key: string) => {
        if (!data) return;
        
        // Filter by device if specified
        if (deviceId && data.deviceId !== deviceId) return;
        
        // Filter by time if specified
        if (since && data.lastModified && data.lastModified < since) return;
        
        // Filter out deleted entries
        if (data.deleted) return;
        
        entries.push(data);
      });

      // Give Gun some time to collect all the data
      setTimeout(() => {
        resolve(entries);
      }, 100);
    });
  }

  async mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void> {
    // In GunDB, data is automatically merged, but we can still process incoming entries
    for (const entry of remoteEntries) {
      await this.addEntry(entry);
    }
    return Promise.resolve();
  }

  async updateDevice(device: DeviceInfo): Promise<void> {
    return new Promise((resolve) => {
      const deviceWithTimestamp = {
        ...device,
        lastSeen: Date.now()
      };

      this.devicesRef.get(device.deviceId).put(deviceWithTimestamp, (ack: any) => {
        if (ack.err) {
          console.error('Error updating device in GunDB:', ack.err);
        }
        resolve();
      });
    });
  }

  async getDevices(): Promise<DeviceInfo[]> {
    return new Promise((resolve) => {
      const devices: DeviceInfo[] = [];
      
      this.devicesRef.map().once((data: DeviceInfo, key: string) => {
        if (!data) return;
        devices.push(data);
      });

      // Give Gun some time to collect all the data
      setTimeout(() => {
        resolve(devices);
      }, 100);
    });
  }

  async deleteEntry(visitId: string): Promise<void> {
    return new Promise((resolve) => {
      // Get the entry first
      this.historyRef.get(visitId).once((data: HistoryEntry) => {
        if (!data) {
          resolve();
          return;
        }
        
        // Mark as deleted instead of actually deleting
        const updatedEntry = {
          ...data,
          deleted: true,
          lastModified: Date.now()
        };
        
        this.historyRef.get(visitId).put(updatedEntry, (ack: any) => {
          if (ack.err) {
            console.error('Error deleting entry in GunDB:', ack.err);
          }
          resolve();
        });
      });
    });
  }

  async updatePageContent(url: string, pageContent: { content: string, summary: string }): Promise<void> {
    return new Promise((resolve) => {
      // Find entries with this URL
      const entries: HistoryEntry[] = [];
      
      this.historyRef.map().once((data: HistoryEntry, key: string) => {
        if (!data || data.url !== url) return;
        entries.push({...data, key});
      });

      // Give Gun some time to collect all the data
      setTimeout(() => {
        if (entries.length === 0) {
          resolve();
          return;
        }
        
        // Find the most recent entry
        const mostRecentEntry = entries.reduce((latest, current) => {
          return current.visitTime > latest.visitTime ? current : latest;
        }, entries[0]);
        
        // Update the entry with the summary
        const updatedEntry = {
          ...mostRecentEntry,
          pageContent: {
            content: '', // Never store content, only use it for summary generation
            summary: pageContent.summary,
            extractedAt: Date.now()
          },
          lastModified: Date.now()
        };
        
        this.historyRef.get(mostRecentEntry.visitId).put(updatedEntry, (ack: any) => {
          if (ack.err) {
            console.error('Error updating page content in GunDB:', ack.err);
          }
          resolve();
        });
      }, 100);
    });
  }

  async searchContent(query: string): Promise<{ entry: HistoryEntry, matches: { text: string, context: string }[] }[]> {
    if (!query || query.trim().length === 0) return [];
    
    return new Promise((resolve) => {
      const entries: HistoryEntry[] = [];
      
      this.historyRef.map().once((data: HistoryEntry, key: string) => {
        if (!data || data.deleted) return;
        entries.push(data);
      });

      // Give Gun some time to collect all the data
      setTimeout(() => {
        const results: { entry: HistoryEntry, matches: { text: string, context: string }[] }[] = [];
        const lowerQuery = query.toLowerCase();
        
        for (const entry of entries) {
          const matches: { text: string, context: string }[] = [];
          
          // Search in summary (if available)
          if (entry.pageContent?.summary) {
            const summary = entry.pageContent.summary.toLowerCase();
            let startIndex = 0;
            
            while (startIndex < summary.length) {
              const foundIndex = summary.indexOf(lowerQuery, startIndex);
              if (foundIndex === -1) break;
              
              // Get context around the match (entire summary is the context)
              const matchText = entry.pageContent.summary.substring(foundIndex, foundIndex + query.length);
              const context = entry.pageContent.summary;
              
              matches.push({
                text: matchText,
                context: context
              });
              
              startIndex = foundIndex + query.length;
            }
          }
          
          // Search in title
          if (entry.title) {
            const title = entry.title.toLowerCase();
            if (title.includes(lowerQuery)) {
              matches.push({
                text: query,
                context: `Title: ${entry.title}`
              });
            }
          }
          
          // Search in URL
          if (entry.url) {
            const url = entry.url.toLowerCase();
            if (url.includes(lowerQuery)) {
              matches.push({
                text: query,
                context: `URL: ${entry.url}`
              });
            }
          }
          
          if (matches.length > 0) {
            results.push({
              entry,
              matches
            });
          }
        }
        
        resolve(results);
      }, 100);
    });
  }
}