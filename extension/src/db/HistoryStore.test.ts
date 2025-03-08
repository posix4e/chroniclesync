import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryStore } from './HistoryStore';
import { HistoryEntry } from '../types';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

const mockIDBDatabase = {
  createObjectStore: vi.fn(),
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(),
  },
};

const mockIDBObjectStore = {
  createIndex: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  index: vi.fn(),
};

const mockIDBIndex = {
  getAll: vi.fn(),
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
};

const mockIDBRequest = {
  result: null,
  error: null,
  transaction: mockIDBTransaction,
};

// Sample history entries with page content
const mockHistoryEntries: HistoryEntry[] = [
  {
    visitId: '1',
    url: 'https://example.com/page1',
    title: 'Example Page 1',
    visitTime: Date.now() - 3600000,
    referringVisitId: '',
    transition: 'link',
    deviceId: 'device1',
    platform: 'Windows',
    userAgent: 'Chrome',
    browserName: 'Chrome',
    browserVersion: '100',
    syncStatus: 'synced',
    lastModified: Date.now() - 3600000,
    pageContent: {
      content: 'This is the content of page 1 with some unique test content.',
      summary: 'This is the content of page 1.',
      extractedAt: Date.now() - 3600000
    }
  },
  {
    visitId: '2',
    url: 'https://example.com/page2',
    title: 'Example Page 2',
    visitTime: Date.now() - 7200000,
    referringVisitId: '',
    transition: 'link',
    deviceId: 'device1',
    platform: 'Windows',
    userAgent: 'Chrome',
    browserName: 'Chrome',
    browserVersion: '100',
    syncStatus: 'synced',
    lastModified: Date.now() - 7200000,
    pageContent: {
      content: 'This is the content of page 2 with some different test content.',
      summary: 'This is the content of page 2.',
      extractedAt: Date.now() - 7200000
    }
  },
  {
    visitId: '3',
    url: 'https://example.com/page3',
    title: 'Example Page 3',
    visitTime: Date.now() - 10800000,
    referringVisitId: '',
    transition: 'link',
    deviceId: 'device1',
    platform: 'Windows',
    userAgent: 'Chrome',
    browserName: 'Chrome',
    browserVersion: '100',
    syncStatus: 'synced',
    lastModified: Date.now() - 10800000,
    deleted: true, // This entry is deleted and should not appear in search results
    pageContent: {
      content: 'This is the content of page 3 with some unique test content.',
      summary: 'This is the content of page 3.',
      extractedAt: Date.now() - 10800000
    }
  },
  {
    visitId: '4',
    url: 'https://example.com/page4',
    title: 'Example Page 4',
    visitTime: Date.now() - 14400000,
    referringVisitId: '',
    transition: 'link',
    deviceId: 'device1',
    platform: 'Windows',
    userAgent: 'Chrome',
    browserName: 'Chrome',
    browserVersion: '100',
    syncStatus: 'synced',
    lastModified: Date.now() - 14400000,
    // This entry has no page content
  }
];

describe('HistoryStore', () => {
  let historyStore: HistoryStore;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock global.indexedDB
    global.indexedDB = mockIndexedDB as any;
    
    // Set up the mock chain for IndexedDB
    mockIndexedDB.open.mockReturnValue(mockIDBRequest);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    mockIDBObjectStore.index.mockReturnValue(mockIDBIndex);
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBObjectStore.get.mockReturnValue({ ...mockIDBRequest });
    mockIDBObjectStore.put.mockReturnValue({ ...mockIDBRequest });
    mockIDBObjectStore.getAll.mockReturnValue({ ...mockIDBRequest });
    mockIDBIndex.getAll.mockReturnValue({ ...mockIDBRequest });
    
    // Create a new HistoryStore instance
    historyStore = new HistoryStore();
  });
  
  describe('searchContent', () => {
    it('should return empty array for empty query', async () => {
      // Mock the init method
      historyStore.init = vi.fn().mockResolvedValue(undefined);
      historyStore.db = mockIDBDatabase as any;
      
      const results = await historyStore.searchContent('');
      
      expect(results).toEqual([]);
    });
    
    it('should search for content in history entries', async () => {
      // Mock the init method
      historyStore.init = vi.fn().mockResolvedValue(undefined);
      historyStore.db = mockIDBDatabase as any;
      
      // Set up the mock to return our test entries
      const getAllRequest = { ...mockIDBRequest, result: mockHistoryEntries };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);
      
      // Trigger the success callback when getAll is called
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          getAllRequest.onsuccess && getAllRequest.onsuccess(new Event('success'));
        }, 0);
        return getAllRequest;
      });
      
      // Search for "unique test content"
      const results = await historyStore.searchContent('unique test content');
      
      // Should find entries 1 and not entry 3 (which is deleted)
      expect(results.length).toBe(1);
      expect(results[0].entry.visitId).toBe('1');
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0].text).toBe('unique test content');
    });
    
    it('should filter out deleted entries', async () => {
      // Mock the init method
      historyStore.init = vi.fn().mockResolvedValue(undefined);
      historyStore.db = mockIDBDatabase as any;
      
      // Set up the mock to return our test entries
      const getAllRequest = { ...mockIDBRequest, result: mockHistoryEntries };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);
      
      // Trigger the success callback when getAll is called
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          getAllRequest.onsuccess && getAllRequest.onsuccess(new Event('success'));
        }, 0);
        return getAllRequest;
      });
      
      // Search for content that appears in both entry 1 and deleted entry 3
      const results = await historyStore.searchContent('unique test content');
      
      // Should not include deleted entry 3
      const hasDeletedEntry = results.some(result => result.entry.visitId === '3');
      expect(hasDeletedEntry).toBe(false);
    });
    
    it('should filter out entries without page content', async () => {
      // Mock the init method
      historyStore.init = vi.fn().mockResolvedValue(undefined);
      historyStore.db = mockIDBDatabase as any;
      
      // Set up the mock to return our test entries
      const getAllRequest = { ...mockIDBRequest, result: mockHistoryEntries };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);
      
      // Trigger the success callback when getAll is called
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          getAllRequest.onsuccess && getAllRequest.onsuccess(new Event('success'));
        }, 0);
        return getAllRequest;
      });
      
      // Search for any content
      const results = await historyStore.searchContent('content');
      
      // Should not include entry 4 which has no page content
      const hasEntryWithoutContent = results.some(result => result.entry.visitId === '4');
      expect(hasEntryWithoutContent).toBe(false);
    });
    
    it('should include context around matches', async () => {
      // Mock the init method
      historyStore.init = vi.fn().mockResolvedValue(undefined);
      historyStore.db = mockIDBDatabase as any;
      
      // Set up the mock to return our test entries
      const getAllRequest = { ...mockIDBRequest, result: mockHistoryEntries };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);
      
      // Trigger the success callback when getAll is called
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          getAllRequest.onsuccess && getAllRequest.onsuccess(new Event('success'));
        }, 0);
        return getAllRequest;
      });
      
      // Search for "test content"
      const results = await historyStore.searchContent('test content');
      
      // Check that matches include context
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0].context.length).toBeGreaterThan(results[0].matches[0].text.length);
      expect(results[0].matches[0].context).toContain(results[0].matches[0].text);
    });
  });
});