import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { syncHistory, type HistoryEntry } from '../src/api';
import * as config from '../config';

interface StoredHistoryEntry {
  url: string;
  title: string;
  visitTime: number;
}

describe('History Sync Integration', () => {
  const testClientId = 'test-client-' + Date.now();
  const apiUrl = 'https://api-staging.chroniclesync.xyz';

  beforeAll(() => {
    // Mock getConfig to use staging API
    vi.spyOn(config, 'getConfig').mockImplementation(() => Promise.resolve({
      apiUrl,
      clientId: testClientId,
      pagesUrl: 'https://staging.chroniclesync.xyz'
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should successfully sync and retrieve history entries', async () => {
    const testUrl = 'https://example.com/test-' + Date.now();
    const entries: HistoryEntry[] = [
      {
        url: testUrl,
        title: 'Test Page',
        visitTime: Date.now()
      }
    ];

    // Sync history
    const syncResult = await syncHistory(entries);
    expect(syncResult).toBe(true);

    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify history was stored
    const response = await fetch(`${apiUrl}/api/history?clientId=${testClientId}`);
    expect(response.ok).toBe(true);


    const data = await response.json() as StoredHistoryEntry[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Find our test entry
    const foundEntry = data.find(entry => entry.url === testUrl);
    expect(foundEntry).toBeDefined();
    expect(foundEntry?.title).toBe('Test Page');
  });

  it('should handle duplicate entries gracefully', async () => {
    const testUrl = 'https://example.com/test-' + Date.now();
    const entries: HistoryEntry[] = [
      {
        url: testUrl,
        title: 'Test Page',
        visitTime: Date.now()
      }
    ];

    // Sync same entry twice
    const firstSync = await syncHistory(entries);
    expect(firstSync).toBe(true);

    const secondSync = await syncHistory(entries);
    expect(secondSync).toBe(true);

    // Wait for syncs to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify history
    const response = await fetch(`${apiUrl}/api/history?clientId=${testClientId}`);
    expect(response.ok).toBe(true);

    const data = await response.json() as StoredHistoryEntry[];
    
    // Count occurrences of our test URL
    const occurrences = data.filter(entry => entry.url === testUrl).length;
    expect(occurrences).toBe(1); // Should only store one copy
  });

  it('should handle large batches of history entries', async () => {
    const entries: HistoryEntry[] = Array.from({ length: 100 }, (_, i) => ({
      url: `https://example.com/test-${Date.now()}-${i}`,
      title: `Test Page ${i}`,
      visitTime: Date.now() + i
    }));

    // Sync large batch
    const syncResult = await syncHistory(entries);
    expect(syncResult).toBe(true);

    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify history was stored
    const response = await fetch(`${apiUrl}/api/history?clientId=${testClientId}`);
    expect(response.ok).toBe(true);

    const data = await response.json() as StoredHistoryEntry[];
    expect(Array.isArray(data)).toBe(true);

    // Verify all entries were stored
    const storedUrls = new Set(data.map(entry => entry.url));
    entries.forEach(entry => {
      expect(storedUrls.has(entry.url)).toBe(true);
    });
  });
});