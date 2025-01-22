import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../extension',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/popup.tsx',
      output: {
        entryFileNames: 'popup.js',
        format: 'iife',
        inlineDynamicImports: true,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});