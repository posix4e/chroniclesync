import { renderHook, act } from '@testing-library/react';
import { useStorage } from '../src/hooks/useStorage';
import { StorageService } from '../src/storage/StorageService';
import { IDBFactory } from 'fake-indexeddb';

// Mock IndexedDB
const indexedDB = new IDBFactory();
(global as any).indexedDB = indexedDB;

describe('useStorage', () => {
  const mockItem = {
    id: '1',
    url: 'https://example.com',
    title: 'Example',
    timestamp: Date.now(),
    syncStatus: 'pending' as const,
  };

  beforeEach(async () => {
    const storage = new StorageService();
    await storage.init();
    await storage.clearAll();
  });

  it('should load items', async () => {
    const { result } = renderHook(() => useStorage());

    expect(result.current.loading).toBe(true);
    await act(async () => {
      await result.current.loadItems();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it('should add and load items', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(mockItem);
  });

  it('should search items', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.addItem(mockItem);
      await result.current.addItem({
        ...mockItem,
        id: '2',
        title: 'Different',
        url: 'https://different.com',
      });
    });

    await act(async () => {
      await result.current.searchItems('example');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(mockItem);
  });

  it('should update item status', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.addItem(mockItem);
      await result.current.updateItemStatus(mockItem.id, 'synced');
    });

    expect(result.current.items[0].syncStatus).toBe('synced');
  });

  it('should delete items', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.addItem(mockItem);
      await result.current.deleteItem(mockItem.id);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should export and import history', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    let exported: string | null = null;
    await act(async () => {
      exported = await result.current.exportHistory();
    });

    await act(async () => {
      await result.current.clearAll();
      if (exported) {
        await result.current.importHistory(exported);
      }
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(mockItem);
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.importHistory('invalid json');
    });

    expect(result.current.error).toBeTruthy();
  });
});