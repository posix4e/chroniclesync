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