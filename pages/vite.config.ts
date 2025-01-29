import { defineConfig } from 'vite';
import type { ModuleFormat } from 'rollup';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig(({ command }) => {
  const isExtension = process.env.BUILD_TARGET === 'extension';
  const buildEntry = process.env.BUILD_ENTRY;

  if (!isExtension) {
    return {
      plugins: [react()],
      build: {
        outDir: paths.webDist,
        emptyOutDir: true,
        rollupOptions: {
          input: 'src/index.tsx',
          output: {
            format: 'es' as ModuleFormat,
            entryFileNames: '[name].[hash].js',
            assetFileNames: 'assets/[name].[ext]'
          }
        }
      },
      server: {
        port: server.port
      }
    };
  }

  // Extension build configuration
  const input = buildEntry === 'popup' ? paths.popup : paths.background;
  const name = buildEntry || 'extension';

  return {
    plugins: [react()],
    build: {
      outDir: paths.extensionDist,
      emptyOutDir: false,
      minify: false,
      rollupOptions: {
        input,
        output: {
          format: 'iife' as ModuleFormat,
          entryFileNames: '[name].js',
          dir: paths.extensionDist,
          globals: { chrome: 'chrome' },
          name,
          inlineDynamicImports: true
        },
        external: ['chrome']
      }
    }
  },
  server: {
    port: server.port
  }
});