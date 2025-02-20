import { StorageService } from '../src/storage/StorageService';
import { HistoryItem } from '../src/history/HistoryViewer';
import { IDBFactory } from 'fake-indexeddb';

// Mock IndexedDB
const indexedDB = new IDBFactory();
(global as any).indexedDB = indexedDB;

describe('StorageService', () => {
  let storage: StorageService;
  const mockItem: HistoryItem = {
    id: '1',
    url: 'https://example.com',
    title: 'Example',
    timestamp: Date.now(),
    syncStatus: 'pending',
  };

  beforeEach(async () => {
    storage = new StorageService();
    await storage.init();
  });

  afterEach(async () => {
    await storage.clearAll();
  });

  it('should add and retrieve history items', async () => {
    await storage.addHistoryItem(mockItem);
    const items = await storage.getHistoryItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(mockItem);
  });

  it('should search history items', async () => {
    await storage.addHistoryItem(mockItem);
    await storage.addHistoryItem({
      ...mockItem,
      id: '2',
      title: 'Different',
      url: 'https://different.com',
    });

    const results = await storage.searchHistoryItems('example');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(mockItem);
  });

  it('should update sync status', async () => {
    await storage.addHistoryItem(mockItem);
    await storage.updateSyncStatus(mockItem.id, 'synced');
    
    const items = await storage.getItemsByStatus('synced');
    expect(items).toHaveLength(1);
    expect(items[0].syncStatus).toBe('synced');
  });

  it('should delete history items', async () => {
    await storage.addHistoryItem(mockItem);
    await storage.deleteHistoryItem(mockItem.id);
    
    const items = await storage.getHistoryItems();
    expect(items).toHaveLength(0);
  });

  it('should export and import data', async () => {
    await storage.addHistoryItem(mockItem);
    const exported = await storage.exportData();
    await storage.clearAll();
    
    await storage.importData(exported);
    const items = await storage.getHistoryItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(mockItem);
  });

  it('should handle invalid import data', async () => {
    await expect(storage.importData('invalid json')).rejects.toThrow();
  });

  it('should prune old items when limit is exceeded', async () => {
    const items = Array.from({ length: 10001 }, (_, i) => ({
      ...mockItem,
      id: i.toString(),
      timestamp: Date.now() + i,
    }));

    for (const item of items) {
      await storage.addHistoryItem(item);
    }

    const allItems = await storage.getHistoryItems(10001);
    expect(allItems.length).toBeLessThanOrEqual(10000);
  });
});