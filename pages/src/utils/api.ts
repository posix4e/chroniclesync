import { HistoryResponse, HistoryFilters } from '../types/history';
import { HistoryEncryption } from './encryption';

export const API_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'chroniclesync.xyz') {
    return 'https://api.chroniclesync.xyz';
  }
  
  if (hostname.includes('chroniclesync-pages.pages.dev')) {
    return 'https://api-staging.chroniclesync.xyz';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // For e2e tests, we use the mock API
    if (process.env.NODE_ENV === 'test') {
      return window.location.origin;
    }
    return 'http://localhost:8787';
  }
  
  return 'https://api.chroniclesync.xyz';
})();

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

let encryptionInstance: HistoryEncryption | null = null;

export const initializeEncryption = async (seed: Buffer) => {
  encryptionInstance = new HistoryEncryption(seed);
};

export const fetchHistory = async (clientId: string, filters?: HistoryFilters): Promise<HistoryResponse> => {
  if (!encryptionInstance) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }

  const params = new URLSearchParams({ clientId });
  
  if (filters) {
    if (filters.startDate) params.append('startDate', filters.startDate.toString());
    if (filters.endDate) params.append('endDate', filters.endDate.toString());
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.browser) params.append('browser', filters.browser);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
  }

  const response = await fetch(`${API_URL}/history?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
  // Ensure the response has the expected shape
  if (!data || !Array.isArray(data.history)) {
    throw new Error('Invalid response format: missing history array');
  }

  // Decrypt the history items
  const decryptedHistory = await encryptionInstance.decryptHistoryItems(data.history);
  
  return {
    history: decryptedHistory,
    deviceInfo: data.deviceInfo || {
      deviceId: 'unknown',
      platform: 'unknown',
      userAgent: 'unknown',
      browserName: 'unknown',
      browserVersion: 'unknown'
    },
    pagination: data.pagination || {
      total: data.history?.length || 0,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 10,
      totalPages: Math.ceil((data.history?.length || 0) / (filters?.pageSize || 10))
    }
  };
};