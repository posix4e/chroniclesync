import { getConfig } from '../config';

export interface HistoryEntry {
  url: string;
  title?: string;
  visitTime: number;
}

export async function syncHistory(entries: HistoryEntry[]): Promise<boolean> {
  try {
    const config = await getConfig();
    const response = await fetch(`${config.apiEndpoint}/api/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId,
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      console.error('Failed to sync history:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error syncing history:', error);
    return false;
  }
}