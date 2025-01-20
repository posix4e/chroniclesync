import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../extension/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'src/index.tsx'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});