import { resolve } from 'path';

export const paths = {
  extension: resolve(__dirname, '../extension'),
  extensionDist: resolve(__dirname, '../extension/dist'),
  webDist: resolve(__dirname, 'dist'),
  popup: resolve(__dirname, 'src/popup.tsx')
};

export const server = {
  port: 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  workerUrl: process.env.WORKER_URL || 'http://localhost:8787'
};