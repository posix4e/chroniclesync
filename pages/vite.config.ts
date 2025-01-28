import { defineConfig } from 'vite';
import { type PreRenderedChunk } from 'rollup';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: process.env.BUILD_TARGET === 'extension' ? paths.extensionDist : paths.webDist,
    emptyOutDir: true,
    rollupOptions: {
      input: process.env.BUILD_TARGET === 'extension' ? {
        popup: paths.popup,
        background: paths.background,
        styles: paths.styles
      } : 'src/index.tsx',
      output: {
        format: 'iife',
        entryFileNames: (chunk: PreRenderedChunk) => {
          return chunk.name === 'background' ? '[name].js' : '[name].[hash].js';
        },
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      },
      minify: false
    }
  },
  server: {
    port: server.port
  }
});