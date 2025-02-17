import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.browser': true
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
      stream: 'stream-browserify',
      process: 'process/browser'
    }
  },
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
    port: server.port
  }
});