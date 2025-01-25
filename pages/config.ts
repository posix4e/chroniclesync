export const paths = {
  extension: '../extension',
  extensionDist: '../extension/dist',
  webDist: 'dist',
  popup: 'src/popup.tsx',
  background: 'src/background.ts'
};

export const server = {
  port: 3000,
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz'
};