import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, '../src/pages/popup/index.html'),
        options: resolve(__dirname, '../src/pages/options/index.html'),
        background: resolve(__dirname, '../src/background-new.ts'),
        content: resolve(__dirname, '../src/content/content-script.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
});