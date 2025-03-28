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

// Default server configuration (for build tools only, not for browser)
export const defaultServer = {
  port: 3000,
  host: '0.0.0.0',
  cors: true
};