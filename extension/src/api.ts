import { getConfig } from '../config';

export interface HistoryEntry {
  url: string;
  title?: string;
  visitTime: number;
}

export async function syncHistory(entries: HistoryEntry[]): Promise<boolean> {
  try {
    const config = await getConfig();
    const url = new URL(`${config.apiEndpoint}/api/history`);
    url.searchParams.set('clientId', config.clientId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entries),
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