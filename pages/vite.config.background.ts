import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../extension/dist',
    rollupOptions: {
      input: 'src/background.ts',
      output: {
        entryFileNames: 'background.js',
        format: 'iife'
      }
    }
  }
});