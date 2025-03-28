/**
 * Shared constants used across the application
 */
import { urls } from './config';

export { urls };

// Sync status values
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed'
} as const;

// Default client ID
export const DEFAULT_CLIENT_ID = 'extension-default';

// Storage keys
export const STORAGE_KEYS = {
  API_ENDPOINT: 'apiEndpoint',
  PAGES_URL: 'pagesUrl',
  CLIENT_ID: 'clientId',
  ENVIRONMENT: 'environment',
  CUSTOM_API_URL: 'customApiUrl',
  LAST_SYNC_TIME: 'lastSyncTime',
  SYNC_ENABLED: 'syncEnabled'
} as const;

// Environment types
export const ENVIRONMENTS = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  CUSTOM: 'custom',
  DEVELOPMENT: 'development'
} as const;