export const paths = {
  extension: '../extension',
  extensionDist: '../extension/dist',
  webDist: 'dist',
  popup: 'src/popup.tsx',
  background: 'src/background.ts'
};

export const server = {
  port: process.env.PORT || 51145,
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz'
};