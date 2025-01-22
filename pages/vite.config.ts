import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../extension',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: 'src/popup.tsx',
        background: 'src/background.ts'
      },
      output: [
        {
          entryFileNames: '[name].js',
          format: 'iife',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      ]
    }
  },
  server: {
    port: 3000,
  },
});