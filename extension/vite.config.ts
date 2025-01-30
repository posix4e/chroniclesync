import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'background.js')
      },
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    }
  },
  server: {
    port: 54512,
    host: '0.0.0.0',
    cors: true
  }
});