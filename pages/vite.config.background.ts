import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../extension',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/background.ts',
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});