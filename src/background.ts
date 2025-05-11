import { getConfig } from './config';
import { HistoryStore } from './db/HistoryStore';
import { getSystemInfo } from './utils/system';
import { HistoryEntry, DeviceInfo } from './types';
import { DirectP2PSync } from './p2p';
import { BackgroundSettings } from './settings/index';

interface SyncResponse {
  history?: HistoryEntry[];
  devices?: DeviceInfo[];
  lastSyncTime?: number;
}

interface SyncStats {
  sent: number;
  received: number;
  devices: number;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Export for testing
export let p2pSync: DirectP2PSync | null = null;

// Function for testing
export async function init(): Promise<void> {
  try {
    interface Settings {
      clientId?: string;
      mnemonic?: string;
      syncMode?: string;
    }
    const settings = await new Promise<Settings>((resolve) => {
      chrome.storage.local.get(['clientId', 'mnemonic', 'syncMode'], 
        (result) => resolve(result as Settings));
    });
    
    if (settings.syncMode === 'p2p' && settings.clientId && settings.mnemonic) {
      // Get known peers from storage
      const peerSettings = await chrome.storage.local.get(['knownPeers']);
      const knownPeers = peerSettings.knownPeers || [];
      
      // Use DirectP2PSync instead of P2PSync to avoid signaling server
      p2pSync = new DirectP2PSync(
        settings.clientId,
        settings.mnemonic,
        knownPeers
      );
      
      p2pSync.setOnHistoryReceived((entries) => {
        console.log('Received history entries via P2P:', entries.length);
      });
      
      p2pSync.setOnDeviceReceived((deviceInfo) => {
        console.log('Received device info via P2P:', deviceInfo);
      });
      
      try {
        // Get ICE servers from settings
        const backgroundSettings = new BackgroundSettings();
        await backgroundSettings.init();
        const iceServersJson = backgroundSettings.getIceServers();
        const iceServers = JSON.parse(iceServersJson);
        
        await p2pSync.connect(iceServers);
        console.log('Connected to P2P network using direct connections');
      } catch (error) {
        console.error('Failed to connect to P2P network:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing P2P sync:', error);
  }
}

// Function for testing
export async function syncHistory(entries: HistoryEntry[]): Promise<void> {
  if (p2pSync) {
    await p2pSync.sendHistoryEntries(entries);
  }
}

// Function for testing
export async function syncDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
  if (p2pSync) {
    await p2pSync.sendDeviceInfo(deviceInfo);
  }
}

// Export for testing
export async function cleanup(): Promise<void> {
  if (p2pSync) {
    await p2pSync.disconnect();
    p2pSync = null;
  }
}

async function initializeExtension(): Promise<boolean> {
  try {
    await chrome.storage.local.get(['initialized']);
    await getConfig();
    await chrome.storage.local.set({ initialized: true });
    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

// Export for testing
export async function syncHistoryForce(forceFullSync = false): Promise<void> {
  return syncHistoryInternal(forceFullSync);
}

async function syncHistoryInternal(forceFullSync = false): Promise<void> {
  try {
    const initialized = await chrome.storage.local.get(['initialized']);
    if (!initialized.initialized) {
      const success = await initializeExtension();
      if (!success) {
        console.debug('Sync skipped: Extension not initialized');
        return;
      }
    }

    const config = await getConfig();

    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    console.debug('Starting sync with client ID:', config.clientId);

    // Get sync mode from storage
    const syncSettings = await chrome.storage.sync.get(['syncMode', 'mnemonic']);
    const syncMode = syncSettings.syncMode || 'server';
    const mnemonic = syncSettings.mnemonic || '';
    
    // Initialize settings
    const settings = new BackgroundSettings();
    await settings.init();

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const startTime = forceFullSync ? 0 : storedLastSync;

    const historyStore = new HistoryStore();
    await historyStore.init();

    await historyStore.updateDevice(systemInfo);

    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000
    });

    const historyData = await Promise.all(historyItems.map(async item => {
      if (!item.url) return [];
      const visits = await chrome.history.getVisits({ url: item.url });
      
      return visits
        .filter((visit: chrome.history.VisitItem) => {
          const visitTime = visit.visitTime || 0;
          return visitTime >= startTime && visitTime <= now;
        })
        .map((visit: chrome.history.VisitItem) => ({
          url: item.url!,
          title: item.title || '',
          visitTime: visit.visitTime || Date.now(),
          visitId: visit.visitId.toString(),
          referringVisitId: visit.referringVisitId?.toString() || '0',
          transition: visit.transition || 'link',
          ...systemInfo
        }));
    }));

    const flattenedHistoryData = historyData.flat();
    
    for (const entry of flattenedHistoryData) {
      await historyStore.addEntry(entry);
    }

    const unsyncedEntries = await historyStore.getUnsyncedEntries();

    if (unsyncedEntries.length > 0) {
      if (syncMode === 'p2p') {
        // P2P sync mode
        console.debug('Using P2P sync mode');
        
        // Initialize P2P sync if not already initialized
        if (!p2pSync && mnemonic) {
          // Get known peers from storage
          const peerSettings = await chrome.storage.local.get(['knownPeers']);
          const knownPeers = peerSettings.knownPeers || [];
          
          // Use DirectP2PSync instead of P2PSync to avoid signaling server
          p2pSync = new DirectP2PSync(config.clientId, mnemonic, knownPeers);
          
          // Set up callbacks
          p2pSync.setOnHistoryReceived(async (entries: HistoryEntry[]) => {
            console.debug(`Received ${entries.length} history entries via P2P`);
            await historyStore.mergeRemoteEntries(entries);
            
            // Send sync complete message
            try {
              chrome.runtime.sendMessage({ 
                type: 'syncComplete',
                stats: {
                  sent: 0,
                  received: entries.length,
                  devices: 0
                } as SyncStats
              }).catch(() => {
                // Ignore error when no receivers are present
              });
            } catch {
              // Catch any other messaging errors
            }
          });
          
          p2pSync.setOnDeviceReceived(async (device: DeviceInfo) => {
            console.debug(`Received device info via P2P: ${device.deviceId}`);
            await historyStore.updateDevice(device);
          });
          
          // Connect to P2P network
          try {
            // Get ICE servers from settings
            const iceServersJson = settings.getIceServers();
            const iceServers = JSON.parse(iceServersJson);
            
            await p2pSync.connect(iceServers);
            console.log('Connected to P2P network using direct connections');
          } catch (error) {
            console.error('Error connecting to P2P network:', error);
          }
        }
        
        // Send unsynced entries to peers
        if (p2pSync) {
          try {
            await p2pSync.sendHistoryEntries(unsyncedEntries);
            await p2pSync.sendDeviceInfo(systemInfo);
            
            // Mark entries as synced
            for (const entry of unsyncedEntries) {
              await historyStore.markAsSynced(entry.visitId);
            }
            
            // Update last sync time
            const newLastSync = now;
            const lastSyncDate = new Date(newLastSync).toLocaleString();
            await chrome.storage.local.set({ lastSync: newLastSync });
            await chrome.storage.sync.set({ lastSync: lastSyncDate });
            
            // Send sync complete message
            try {
              chrome.runtime.sendMessage({ 
                type: 'syncComplete',
                stats: {
                  sent: unsyncedEntries.length,
                  received: 0,
                  devices: p2pSync.getConnectedPeers().length
                } as SyncStats
              }).catch(() => {
                // Ignore error when no receivers are present
              });
            } catch {
              // Catch any other messaging errors
            }
          } catch (error) {
            console.error('Error sending data via P2P:', error);
            throw error;
          }
        } else {
          console.error('P2P sync not initialized');
          throw new Error('P2P sync not initialized. Please check your mnemonic phrase.');
        }
      } else {
        // Server sync mode
        console.debug('Using server sync mode');
        
        // Disconnect P2P if it was previously connected
        if (p2pSync) {
          p2pSync.disconnect();
          p2pSync = null;
        }
        
        const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            history: unsyncedEntries,
            deviceInfo: systemInfo,
            lastSync: storedLastSync
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const syncResponse: SyncResponse = await response.json();

        if (syncResponse.history && syncResponse.history.length > 0) {
          await historyStore.mergeRemoteEntries(syncResponse.history);
        }

        if (syncResponse.devices) {
          for (const device of syncResponse.devices) {
            await historyStore.updateDevice(device);
          }
        }

        for (const entry of unsyncedEntries) {
          await historyStore.markAsSynced(entry.visitId);
        }

        const newLastSync = syncResponse.lastSyncTime || now;
        const lastSyncDate = new Date(newLastSync).toLocaleString();
        await chrome.storage.local.set({ lastSync: newLastSync });
        await chrome.storage.sync.set({ lastSync: lastSyncDate });

        try {
          chrome.runtime.sendMessage({ 
            type: 'syncComplete',
            stats: {
              sent: unsyncedEntries.length,
              received: syncResponse.history?.length || 0,
              devices: syncResponse.devices?.length || 0
            } as SyncStats
          }).catch(() => {
            // Ignore error when no receivers are present
          });
        } catch {
          // Catch any other messaging errors
        }
      }
    }

    console.debug('Successfully completed sync');
  } catch (error) {
    console.error('Error syncing history:', error);
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      chrome.runtime.sendMessage({ 
        type: 'syncError',
        error: errorMessage
      }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }
  }
}

// Initial sync with full history
syncHistoryInternal(true);

// Set up periodic sync
setInterval(() => syncHistoryInternal(false), SYNC_INTERVAL);

// Listen for navigation events
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
    if (changeInfo.url) {
      console.debug(`Navigation to: ${changeInfo.url}`);
      setTimeout(() => syncHistoryInternal(false), 1000);
    }
  });
}

// Listen for messages from the page
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getClientId') {
      chrome.storage.local.get(['initialized']).then(async result => {
        if (!result.initialized) {
          const success = await initializeExtension();
          if (!success) {
            sendResponse({ error: 'Extension not initialized' });
            return;
          }
        }

        try {
          const config = await getConfig();
          sendResponse({ clientId: config.clientId === 'extension-default' ? null : config.clientId });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error getting client ID:', errorMessage);
          sendResponse({ error: 'Failed to get client ID' });
        }
      });
      return true; // Will respond asynchronously
    } else if (request.type === 'triggerSync') {
      syncHistoryInternal(true)
        .then(() => {
          sendResponse({ success: true, message: 'Sync successful' });
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Manual sync failed:', errorMessage);
          sendResponse({ error: errorMessage });
        });
      return true; // Will respond asynchronously
    } else if (request.type === 'getHistory') {
      const { deviceId, since, limit } = request;
      const historyStore = new HistoryStore();
      historyStore.init().then(async () => {
        try {
          const entries = await historyStore.getEntries(deviceId, since);
          const limitedEntries = limit ? entries.slice(0, limit) : entries;
          sendResponse(limitedEntries);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error fetching history from IndexedDB:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      });
      return true; // Will respond asynchronously
    } else if (request.type === 'getDevices') {
      const historyStore = new HistoryStore();
      historyStore.init().then(async () => {
        try {
          const devices = await historyStore.getDevices();
          sendResponse(devices);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error fetching devices from IndexedDB:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      });
      return true; // Will respond asynchronously
    } else if (request.type === 'deleteHistory') {
      const { visitId } = request;
      const historyStore = new HistoryStore();
      historyStore.init().then(async () => {
        try {
          await historyStore.deleteEntry(visitId);
          await syncHistoryInternal(false);
          sendResponse({ success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error deleting history entry:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      });
      return true; // Will respond asynchronously
    } else if (request.type === 'pageContentExtracted') {
      // Handle page content extraction from content script
      const { url, summary } = request.data;
      if (url && summary) {
        const historyStore = new HistoryStore();
        historyStore.init().then(async () => {
          try {
            // We pass an empty string for content as we never store or sync content
            await historyStore.updatePageContent(url, { content: '', summary });
            console.debug('Updated page summary for:', url);
            sendResponse({ success: true });
                    
            // We never sync content, only summaries
            // No need to trigger a sync here
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error updating page summary:', errorMessage);
            sendResponse({ error: errorMessage });
          }
        }).catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error initializing IndexedDB:', errorMessage);
          sendResponse({ error: errorMessage });
        });
        return true; // Will respond asynchronously
      }
    } else if (request.type === 'searchHistory') {
      const { query } = request;
      const historyStore = new HistoryStore();
      historyStore.init().then(async () => {
        try {
          const results = await historyStore.searchContent(query);
                
          // Format the results for display
          const formattedResults = results.map(result => ({
            visitId: result.entry.visitId,
            url: result.entry.url,
            title: result.entry.title,
            visitTime: result.entry.visitTime,
            matches: result.matches
          }));
                
          sendResponse({ success: true, results: formattedResults });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error searching history:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error initializing IndexedDB:', errorMessage);
        sendResponse({ error: errorMessage });
      });
      return true; // Will respond asynchronously
    } else if (request.type === 'getP2PStatus') {
      chrome.storage.sync.get(['syncMode'], (syncSettings) => {
        try {
          const syncMode = syncSettings.syncMode || 'server';
                
          if (syncMode === 'p2p' && p2pSync) {
            sendResponse({
              enabled: true,
              connected: p2pSync.getConnectedPeers().length > 0,
              peers: p2pSync.getConnectedPeers()
            });
          } else {
            sendResponse({
              enabled: syncMode === 'p2p',
              connected: false,
              peers: []
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error getting P2P status:', errorMessage);
          sendResponse({ error: errorMessage });
        }
      });
      return true; // Will respond asynchronously
    }
  });
}