import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: process.env.CI ? paths.webDist : paths.extensionDist,
    rollupOptions: {
      input: {
        popup: paths.popup
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  },
  server: {
    port: server.port
  }
});