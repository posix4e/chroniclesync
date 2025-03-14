// Determine if we're running in a CI environment
const isCI = !!process.env.CI;

// For local development, use localhost with the appropriate port
// In CI, use the staging URLs
export const server = {
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz',
  pagesUrl: process.env.PAGES_URL || 'https://staging.chroniclesync.xyz',
  webUrl: process.env.WEB_APP_URL || (isCI ? 'https://staging.chroniclesync.xyz' : 'http://localhost:8080'),
  // Port for local development server
  port: process.env.PORT || '8080'
};