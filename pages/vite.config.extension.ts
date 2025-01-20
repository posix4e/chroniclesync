import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/extension',
    rollupOptions: {
      input: {
        popup: 'src/popup.tsx',
        background: 'src/extension/background.ts'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});