import { SyncService } from '../src/sync/SyncService';
import { StorageService } from '../src/storage/StorageService';
import { HistoryItem } from '../src/history/HistoryViewer';
import { IDBFactory } from 'fake-indexeddb';

// Mock IndexedDB
const indexedDB = new IDBFactory();
(global as any).indexedDB = indexedDB;

// Mock chrome.storage.local
const mockStorage: { [key: string]: any } = {};
(global as any).chrome = {
  storage: {
    local: {
      get: (key: string) => Promise.resolve({ [key]: mockStorage[key] }),
      set: (obj: { [key: string]: any }) => {
        Object.assign(mockStorage, obj);
        return Promise.resolve();
      },
    },
  },
};

describe('SyncService', () => {
  let storage: StorageService;
  let sync: SyncService;
  let mockFetch: jest.Mock;

  const mockItem: HistoryItem = {
    id: '1',
    url: 'https://example.com',
    title: 'Example',
    timestamp: Date.now(),
    lastModified: Date.now(),
    syncStatus: 'pending',
  };

  beforeEach(async () => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

    // Mock fetch
    mockFetch = jest.fn();
    (global as any).fetch = mockFetch;
    (global as any).navigator.onLine = true;

    storage = new StorageService();
    await storage.init();
    await storage.clearAll();

    sync = new SyncService(storage, {
      serverUrl: 'https://test.chroniclesync.com',
      syncInterval: 1000,
      retryAttempts: 2,
      retryDelay: 100,
    });
  });

  it('should sync pending items', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    await storage.addHistoryItem(mockItem);
    await sync.sync();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/history'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(mockItem.id),
      })
    );

    const items = await storage.getItemsByStatus('synced');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(mockItem.id);
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    (global as any).navigator.onLine = false;

    await storage.addHistoryItem(mockItem);
    await sync.sync();

    const items = await storage.getItemsByStatus('error');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(mockItem.id);
  });

  it('should resolve conflicts with server winning', async () => {
    const serverItem = {
      ...mockItem,
      title: 'Server Version',
      lastModified: Date.now() + 1000,
    };

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([serverItem]),
      })
    );

    await storage.addHistoryItem(mockItem);
    await sync.sync();

    const items = await storage.getHistoryItems();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Server Version');
  });

  it('should retry failed syncs', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

    await storage.addHistoryItem(mockItem);
    await sync.sync();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const items = await storage.getItemsByStatus('synced');
    expect(items).toHaveLength(1);
  });

  it('should update last sync timestamp', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    await sync.sync();
    const timestamp = await chrome.storage.local.get('lastSyncTimestamp');
    expect(timestamp.lastSyncTimestamp).toBeTruthy();
  });
});