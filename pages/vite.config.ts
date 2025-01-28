import { defineConfig } from 'vite';
import { type PreRenderedChunk } from 'rollup';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig(({ command }) => {
  const isExtension = process.env.BUILD_TARGET === 'extension';
  
  if (isExtension) {
    // Build background script separately
    if (command === 'build') {
      build({
        build: {
          lib: {
            entry: paths.background,
            name: 'background',
            formats: ['iife'],
            fileName: () => 'background.js'
          },
          outDir: paths.extensionDist,
          emptyOutDir: false,
          minify: false,
          rollupOptions: {
            external: ['chrome'],
            output: {
              globals: {
                chrome: 'chrome'
              }
            }
          }
        }
      });
    }
  }

  return {
    plugins: [react()],
    build: {
      outDir: isExtension ? paths.extensionDist : paths.webDist,
      emptyOutDir: true,
      minify: !isExtension,
      rollupOptions: {
        input: isExtension ? {
          popup: paths.popup,
          styles: paths.styles
        } : 'src/index.tsx',
        output: {
          format: 'es',
          entryFileNames: '[name].[hash].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    server: {
      port: server.port
    }
  };
});