import { HistoryResponse } from '../types/history';

export const API_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'chroniclesync.xyz') {
    return 'https://api.chroniclesync.xyz';
  }
  
  if (hostname.includes('chroniclesync-pages.pages.dev')) {
    return 'https://api-staging.chroniclesync.xyz';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
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

export const fetchHistory = async (clientId: string): Promise<HistoryResponse> => {
  const response = await fetch(`${API_URL}/history?clientId=${encodeURIComponent(clientId)}`);
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
    }
  };
};