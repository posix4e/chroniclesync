import { resolve } from 'path';

// Common URLs and endpoints
export const urls = {
  production: {
    apiEndpoint: 'https://api.chroniclesync.xyz',
    pagesUrl: 'https://chroniclesync.pages.dev',
  },
  staging: {
    apiEndpoint: 'https://api-staging.chroniclesync.xyz',
    pagesUrl: 'https://staging.chroniclesync.pages.dev',
  }
};

// Common paths that can be used across projects
export const commonPaths = {
  extension: resolve(__dirname, '../extension'),
  extensionDist: resolve(__dirname, '../extension/dist'),
  pages: resolve(__dirname, '../pages'),
  pagesDist: resolve(__dirname, '../pages/dist'),
};

// Default server configuration
export const defaultServer = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: '0.0.0.0',
  cors: true
};