import { HistoryItem } from '../types/history';
import { HistoryEncryption } from './encryption';
import { API_URL } from './api';

interface SyncData {
  history: HistoryItem[];
  deviceInfo: {
    deviceId: string;
    platform: string;
    userAgent: string;
    browserName: string;
    browserVersion: string;
  };
}

export const syncHistory = async (
  clientId: string,
  data: SyncData,
  encryptionInstance: HistoryEncryption
): Promise<void> => {
  // Encrypt history items
  const encryptedHistory = await encryptionInstance.encryptHistoryItems(data.history);

  // Prepare data for sync
  const syncData = {
    history: encryptedHistory,
    deviceInfo: data.deviceInfo
  };

  // Send encrypted data to server
  const response = await fetch(`${API_URL}/history?clientId=${clientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(syncData)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
};