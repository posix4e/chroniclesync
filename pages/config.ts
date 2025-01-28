import { resolve } from 'path';

export const paths = {
  extension: resolve(__dirname, '../extension'),
  extensionDist: resolve(__dirname, '../extension/dist'),
  webDist: resolve(__dirname, 'dist'),
  popup: resolve(__dirname, 'src/popup.tsx'),
  background: resolve(__dirname, 'src/background.ts')
};

export const server = {
  port: process.env.PORT || 52054,
  webUrl: process.env.WEB_URL || 'http://localhost:52054',
  host: '0.0.0.0',
  cors: true,
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz'
};