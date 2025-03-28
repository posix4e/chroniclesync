import { getConfig } from '../../config';
import { HistoryStore } from '../db/HistoryStore';
import { getSystemInfo } from '../utils/system';
import { HistoryEntry, DeviceInfo } from '../types';

/**
 * Sync module - Handles synchronization of browser history with the server
 */

interface SyncResponse {
  history?: HistoryEntry[];
  devices?: DeviceInfo[];
  lastSyncTime?: number;
}

export interface SyncStats {
  sent: number;
  received: number;
  devices: number;
}

export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize the extension
 * @returns Promise<boolean> - Whether initialization was successful
 */
export async function initializeExtension(): Promise<boolean> {
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

/**
 * Sync browser history with the server
 * @param forceFullSync - Whether to force a full sync regardless of last sync time
 */
export async function syncHistory(forceFullSync = false): Promise<void> {
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

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    const startTime = forceFullSync ? 0 : storedLastSync;

    const historyStore = new HistoryStore();
    await historyStore.init();

    await historyStore.updateDevice(systemInfo);

    // Fetch history items from Chrome
    const historyItems = await fetchChromeHistory(startTime, now);
    
    // Process and store history items
    for (const entry of historyItems) {
      await historyStore.addEntry(entry);
    }

    // Get unsynced entries and send to server
    const unsyncedEntries = await historyStore.getUnsyncedEntries();
    
    if (unsyncedEntries.length > 0) {
      const syncResponse = await sendToServer(config, unsyncedEntries, systemInfo, storedLastSync);
      
      // Process server response
      await processServerResponse(syncResponse, unsyncedEntries, historyStore, now);
    }

    console.debug('Successfully completed sync');
  } catch (error) {
    console.error('Error syncing history:', error);
    notifySyncError(error);
  }
}

/**
 * Fetch history items from Chrome
 */
async function fetchChromeHistory(startTime: number, endTime: number): Promise<HistoryEntry[]> {
  const systemInfo = await getSystemInfo();
  
  const historyItems = await chrome.history.search({
    text: '',
    startTime: startTime,
    endTime: endTime,
    maxResults: 10000
  });

  const historyData = await Promise.all(historyItems.map(async item => {
    if (!item.url) return [];
    const visits = await chrome.history.getVisits({ url: item.url });
    
    return visits
      .filter((visit: chrome.history.VisitItem) => {
        const visitTime = visit.visitTime || 0;
        return visitTime >= startTime && visitTime <= endTime;
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

  // Add required HistoryEntry properties
  return historyData.flat().map(entry => ({
    ...entry,
    syncStatus: 'pending',
    lastModified: Date.now()
  }));
}

/**
 * Send unsynced entries to the server
 */
async function sendToServer(
  config: { apiEndpoint: string, clientId: string },
  unsyncedEntries: HistoryEntry[],
  deviceInfo: DeviceInfo,
  lastSync: number
): Promise<SyncResponse> {
  const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      history: unsyncedEntries,
      deviceInfo: deviceInfo,
      lastSync: lastSync
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Process the server response
 */
async function processServerResponse(
  syncResponse: SyncResponse,
  unsyncedEntries: HistoryEntry[],
  historyStore: HistoryStore,
  now: number
): Promise<void> {
  // Process received history entries
  if (syncResponse.history && syncResponse.history.length > 0) {
    await historyStore.mergeRemoteEntries(syncResponse.history);
  }

  // Process received device information
  if (syncResponse.devices) {
    for (const device of syncResponse.devices) {
      await historyStore.updateDevice(device);
    }
  }

  // Mark local entries as synced
  for (const entry of unsyncedEntries) {
    await historyStore.markAsSynced(entry.visitId);
  }

  // Update last sync time
  const newLastSync = syncResponse.lastSyncTime || now;
  const lastSyncDate = new Date(newLastSync).toLocaleString();
  await chrome.storage.local.set({ lastSync: newLastSync });
  await chrome.storage.sync.set({ lastSync: lastSyncDate });

  // Notify UI of sync completion
  notifySyncComplete({
    sent: unsyncedEntries.length,
    received: syncResponse.history?.length || 0,
    devices: syncResponse.devices?.length || 0
  });
}

/**
 * Notify UI of sync completion
 */
function notifySyncComplete(stats: SyncStats): void {
  try {
    chrome.runtime.sendMessage({ 
      type: 'syncComplete',
      stats
    }).catch(() => {
      // Ignore error when no receivers are present
    });
  } catch {
    // Catch any other messaging errors
  }
}

/**
 * Notify UI of sync error
 */
function notifySyncError(error: unknown): void {
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

/**
 * Initialize sync scheduler
 */
export function initSyncScheduler(): void {
  // Initial sync with full history
  syncHistory(true);
  
  // Set up periodic sync
  setInterval(() => syncHistory(false), SYNC_INTERVAL);
}