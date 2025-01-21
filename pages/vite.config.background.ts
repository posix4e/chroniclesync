import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/extension',
    rollupOptions: {
      input: 'src/extension/background.ts',
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        dir: 'dist/extension'
      }
    }
  }
});