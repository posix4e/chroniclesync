import { resolve } from 'path';

export const paths = {
  extension: resolve(__dirname, '.'),
  extensionDist: resolve(__dirname, '.'),
  webDist: resolve(__dirname, 'dist'),
  popup: resolve(__dirname, 'src/popup.tsx'),
  background: resolve(__dirname, 'src/background.ts')
};

export const server = {
  port: 3000,
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz'
};