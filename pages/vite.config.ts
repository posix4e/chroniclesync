import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: paths.webDist,
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    }
  },
  server: {
    port: server.port
  }
});