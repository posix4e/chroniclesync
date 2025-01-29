import { resolve } from 'path';

export const paths = {
  extension: resolve(__dirname, 'src'),
  extensionDist: resolve(__dirname, 'dist/extension'),
  webDist: resolve(__dirname, 'dist/web'),
  popup: resolve(__dirname, 'src/popup.tsx'),
  background: resolve(__dirname, 'src/background.ts'),
  styles: resolve(__dirname, 'src/styles.css')
};

export const server = {
  port: parseInt(process.env.PORT || '52054', 10),
  webUrl: process.env.WEB_URL || 'http://localhost:52054',
  apiUrl: process.env.API_URL || 'https://api-staging.chroniclesync.xyz'
};