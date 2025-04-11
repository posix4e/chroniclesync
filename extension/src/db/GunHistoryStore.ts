import Gun from 'gun';
import { HistoryEntry, DeviceInfo } from '../types';
import { IHistoryStore } from './HistoryStoreFactory';

export class GunHistoryStore implements IHistoryStore {
  private readonly DB_NAME = 'chroniclesync';
  private readonly HISTORY_STORE = 'history';
  private readonly DEVICE_STORE = 'devices';
  private gun: any;
  private historyRef: any;
  private devicesRef: any;

  async init(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Initializing GunDB...');
      this.gun = Gun();
      this.historyRef = this.gun.get(this.DB_NAME).get(this.HISTORY_STORE);
      this.devicesRef = this.gun.get(this.DB_NAME).get(this.DEVICE_STORE);
      console.log('GunDB initialized successfully');
      resolve();
    });
  }

  async addEntry(entry: Omit<HistoryEntry, 'syncStatus' | 'lastModified'>): Promise<void> {
    return new Promise((resolve) => {
      const fullEntry: HistoryEntry = {
        ...entry,
        syncStatus: 'pending',
        lastModified: Date.now()
      };

      this.historyRef.get(entry.visitId).put(fullEntry, () => {
        resolve();
      });
    });
  }

  async getUnsyncedEntries(): Promise<HistoryEntry[]> {
    return new Promise((resolve) => {
      const unsyncedEntries: HistoryEntry[] = [];
      
      this.historyRef.map().once((entry: HistoryEntry, id: string) => {
        if (entry && entry.syncStatus === 'pending') {
          unsyncedEntries.push(entry);
        }
      });

      // Gun is asynchronous but doesn't provide a callback when map is complete
      // We need to use a timeout to ensure we've collected all entries
      setTimeout(() => {
        resolve(unsyncedEntries);
      }, 100);
    });
  }

  async markAsSynced(visitId: string): Promise<void> {
    return new Promise((resolve) => {
      this.historyRef.get(visitId).once((entry: HistoryEntry) => {
        if (entry) {
          this.historyRef.get(visitId).put({
            syncStatus: 'synced',
            lastModified: Date.now()
          }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  async getEntries(deviceId?: string, since?: number): Promise<HistoryEntry[]> {
    return new Promise((resolve) => {
      const entries: HistoryEntry[] = [];
      
      this.historyRef.map().once((entry: HistoryEntry) => {
        if (!entry) return;
        
        // Filter by deviceId if provided
        if (deviceId && entry.deviceId !== deviceId) return;
        
        // Filter by lastModified if since is provided
        if (since && entry.lastModified < since) return;
        
        // Filter out deleted entries
        if (entry.deleted) return;
        
        entries.push(entry);
      });

      // Gun is asynchronous but doesn't provide a callback when map is complete
      // We need to use a timeout to ensure we've collected all entries
      setTimeout(() => {
        resolve(entries);
      }, 100);
    });
  }

  async mergeRemoteEntries(remoteEntries: HistoryEntry[]): Promise<void> {
    return new Promise((resolve) => {
      let completed = 0;
      
      if (remoteEntries.length === 0) {
        resolve();
        return;
      }

      remoteEntries.forEach(remoteEntry => {
        this.historyRef.get(remoteEntry.visitId).once((localEntry: HistoryEntry) => {
          // If local entry doesn't exist or remote is newer, update
          if (!localEntry || remoteEntry.lastModified > localEntry.lastModified) {
            this.historyRef.get(remoteEntry.visitId).put({
              ...remoteEntry,
              syncStatus: 'synced'
            }, () => {
              completed++;
              if (completed === remoteEntries.length) {
                resolve();
              }
            });
          } else {
            completed++;
            if (completed === remoteEntries.length) {
              resolve();
            }
          }
        });
      });
    });
  }

  async updateDevice(device: DeviceInfo): Promise<void> {
    return new Promise((resolve) => {
      const deviceWithTimestamp = {
        ...device,
        lastSeen: Date.now()
      };

      this.devicesRef.get(device.deviceId).put(deviceWithTimestamp, () => {
        resolve();
      });
    });
  }

  async getDevices(): Promise<DeviceInfo[]> {
    return new Promise((resolve) => {
      const devices: DeviceInfo[] = [];
      
      this.devicesRef.map().once((device: DeviceInfo) => {
        if (device) {
          devices.push(device);
        }
      });

      // Gun is asynchronous but doesn't provide a callback when map is complete
      // We need to use a timeout to ensure we've collected all devices
      setTimeout(() => {
        resolve(devices);
      }, 100);
    });
  }

  async deleteEntry(visitId: string): Promise<void> {
    return new Promise((resolve) => {
      this.historyRef.get(visitId).once((entry: HistoryEntry) => {
        if (entry) {
          this.historyRef.get(visitId).put({
            deleted: true,
            lastModified: Date.now(),
            syncStatus: 'pending'
          }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  async updatePageContent(url: string, pageContent: { content: string, summary: string }): Promise<void> {
    return new Promise((resolve) => {
      // Find entries with matching URL
      const matchingEntries: HistoryEntry[] = [];
      
      this.historyRef.map().once((entry: HistoryEntry) => {
        if (entry && entry.url === url) {
          matchingEntries.push(entry);
        }
      });

      // Wait for collection to complete
      setTimeout(() => {
        if (matchingEntries.length === 0) {
          resolve();
          return;
        }

        // Find the most recent entry
        const mostRecentEntry = matchingEntries.reduce((latest, current) => {
          return current.visitTime > latest.visitTime ? current : latest;
        }, matchingEntries[0]);

        // Update the entry with ONLY the summary (not the content)
        this.historyRef.get(mostRecentEntry.visitId).put({
          pageContent: {
            content: '', // Never store content, only use it for summary generation
            summary: pageContent.summary,
            extractedAt: Date.now()
          },
          syncStatus: 'pending',
          lastModified: Date.now()
        }, () => {
          resolve();
        });
      }, 100);
    });
  }

  async searchContent(query: string): Promise<{ entry: HistoryEntry, matches: { text: string, context: string }[] }[]> {
    if (!query || query.trim().length === 0) return [];

    return new Promise((resolve) => {
      const entries: HistoryEntry[] = [];
      
      this.historyRef.map().once((entry: HistoryEntry) => {
        if (entry && !entry.deleted) {
          entries.push(entry);
        }
      });

      // Wait for collection to complete
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