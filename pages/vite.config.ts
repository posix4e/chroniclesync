import { defineConfig } from 'vite';
import { type PreRenderedChunk } from 'rollup';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: process.env.BUILD_TARGET === 'extension' ? paths.extensionDist : paths.webDist,
    emptyOutDir: true,
    minify: process.env.BUILD_TARGET === 'extension' ? false : true,
    rollupOptions: {
      input: process.env.BUILD_TARGET === 'extension' ? {
        popup: paths.popup,
        background: paths.background,
        styles: paths.styles
      } : 'src/index.tsx',
      output: [
        {
          // Background script as IIFE
          format: 'iife',
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name].[ext]',
          inlineDynamicImports: true,
          name: 'background',
          globals: {
            chrome: 'chrome'
          }
        },
        {
          // Other files as ES modules
          format: 'es',
          entryFileNames: '[name].[hash].js',
          assetFileNames: 'assets/[name].[ext]',
          inlineDynamicImports: false
        }
      ]
    }
  },
  server: {
    port: server.port
  }
});