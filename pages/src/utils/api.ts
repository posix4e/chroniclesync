import { HistoryResponse, HistoryFilters } from '../types/history';

export const API_ENDPOINTS = {
  production: 'https://api.chroniclesync.xyz',
  staging: 'https://api-staging.chroniclesync.xyz',
  local: 'http://localhost:8787'
};

export const getDefaultApiUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'chroniclesync.xyz') {
    return API_ENDPOINTS.production;
  }
  
  if (hostname.includes('chroniclesync-pages.pages.dev')) {
    return API_ENDPOINTS.staging;
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return API_ENDPOINTS.local;
  }
  
  return API_ENDPOINTS.production;
};

// Default API URL based on hostname
export const API_URL = getDefaultApiUrl();

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const fetchHistory = async (clientId: string, filters?: HistoryFilters): Promise<HistoryResponse> => {
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
  
  return {
    history: data.history || [],
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