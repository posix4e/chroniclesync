export const API_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'chroniclesync.xyz') {
    return 'https://api.chroniclesync.xyz';
  }
  
  if (hostname.endsWith('chroniclesync.pages.dev')) {
    return 'https://api-staging.chroniclesync.xyz';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  
  // Default to staging for any unknown environment for safety
  return 'https://api-staging.chroniclesync.xyz';
})();

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface HistoryParams {
  limit?: number;
  offset?: number;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export const getHistory = async (params: HistoryParams = {}) => {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.clientId) searchParams.set('clientId', params.clientId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const url = `${API_URL}/admin/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Bearer francesisthebest'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  
  return response.json();
};