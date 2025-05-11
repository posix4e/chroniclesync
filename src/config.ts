import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const paths = {
  extensionDist: resolve(__dirname, '../dist'),
  popup: resolve(__dirname, '../popup.html'),
  background: resolve(__dirname, '../background.js'),
  extension: resolve(__dirname, '../dist')
};

// Configuration settings for the application
const config = {
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