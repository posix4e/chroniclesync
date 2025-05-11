// Browser-compatible path handling
export const paths = {
  extensionDist: '/dist',
  popup: '/popup.html',
  background: '/background.js',
  extension: '/dist'
};

// Configuration settings for the application
const config = {
  // Client identification
  clientId: 'extension-default',
  apiEndpoint: 'https://api.chroniclesync.com/v1',
  
  // P2P configuration
  p2p: {
    enabled: true,
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302'
    ],
    connectionTimeout: 30000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  },
  
  // Storage configuration
  storage: {
    maxEntries: 10000,
    syncInterval: 60000
  },
  
  // Security configuration
  security: {
    encryptionEnabled: true,
    authRequired: true
  }
};

/**
 * Get the application configuration
 * @returns The application configuration
 */
export function getConfig() {
  return config;
}