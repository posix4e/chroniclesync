import { HistoryEntry, DeviceInfo } from '../types';
import { getConfig } from '../../config';

interface SyncResponse {
  history?: HistoryEntry[];
  devices?: DeviceInfo[];
  lastSyncTime?: number;
}

/**
 * Sends history entries to the server and receives updates
 */
export async function syncWithServer(
  unsyncedEntries: HistoryEntry[],
  deviceInfo: DeviceInfo,
  lastSync: number
): Promise<SyncResponse> {
  const config = await getConfig();
  
  if (!config.clientId || config.clientId === 'extension-default') {
    throw new Error('Please configure your Client ID in the extension popup');
  }
  
  const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      history: unsyncedEntries,
      deviceInfo,
      lastSync
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Gets the client ID from configuration
 */
export async function getClientId(): Promise<string | null> {
  const config = await getConfig();
  return config.clientId === 'extension-default' ? null : config.clientId;
}