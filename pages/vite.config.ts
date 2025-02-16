import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [wasm(), react()],
  build: {
    outDir: paths.webDist,
    emptyOutDir: true,
    target: 'esnext',
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
    host: '0.0.0.0'
  }
});