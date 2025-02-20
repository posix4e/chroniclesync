import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../storage/StorageService';
import { HistoryItem } from '../history/HistoryViewer';

const storageService = new StorageService();

export function useStorage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);

  const loadItems = useCallback(async (
    limit?: number,
    offset?: number,
    sortOrder?: 'asc' | 'desc'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const loadedItems = await storageService.getHistoryItems(limit, offset, sortOrder);
      setItems(loadedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history items');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchItems = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const searchResults = await storageService.searchHistoryItems(query);
      setItems(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search history items');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: HistoryItem) => {
    try {
      await storageService.addHistoryItem(item);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add history item');
    }
  }, [loadItems]);

  const updateItemStatus = useCallback(async (
    id: string,
    status: HistoryItem['syncStatus']
  ) => {
    try {
      await storageService.updateSyncStatus(id, status);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item status');
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await storageService.deleteHistoryItem(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete history item');
    }
  }, [loadItems]);

  const exportHistory = useCallback(async () => {
    try {
      return await storageService.exportData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export history');
      return null;
    }
  }, []);

  const importHistory = useCallback(async (jsonData: string) => {
    try {
      await storageService.importData(jsonData);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import history');
    }
  }, [loadItems]);

  useEffect(() => {
    storageService.init().then(() => loadItems());
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    loadItems,
    searchItems,
    addItem,
    updateItemStatus,
    deleteItem,
    exportHistory,
    importHistory,
  };
}