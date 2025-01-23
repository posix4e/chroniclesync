import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: paths.webDist,
    rollupOptions: {
      input: {
        index: 'src/index.tsx',
        popup: paths.popup
      },
      output: [
        {
          dir: paths.webDist,
          entryFileNames: '[name].js',
          format: 'es'
        },
        {
          dir: paths.extensionDist,
          entryFileNames: '[name].js',
          format: 'iife',
          inlineDynamicImports: true
        }
      ]
    }
  },
  server: {
    port: server.port
  }
});