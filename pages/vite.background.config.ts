import { defineConfig } from 'vite';
import { paths } from './config';

export default defineConfig({
  build: {
    outDir: paths.extensionDist,
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/background.ts',
      output: {
        format: 'iife',
        entryFileNames: 'background.js',
        dir: paths.extensionDist
      }
    }
  }
});