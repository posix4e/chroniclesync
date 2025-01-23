import { resolve } from 'path';

export const paths = {
  extension: resolve(__dirname, '../extension'),
  extensionDist: resolve(__dirname, '../extension/dist'),
  webDist: resolve(__dirname, 'dist'),
  popup: resolve(__dirname, 'src/popup.tsx')
};

export const server = {
  port: 3000
};