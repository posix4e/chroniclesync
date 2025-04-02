import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: paths.webDist,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    port: server.port,
    host: '0.0.0.0',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
});