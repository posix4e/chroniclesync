import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync, copyFileSync, mkdirSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isExtension = mode === 'extension';

  return {
    plugins: [
      react(),
      {
        name: 'extension-manifest',
        writeBundle: () => {
          if (isExtension) {
            // Copy manifest
            copyFileSync(
              resolve(__dirname, 'src/extension/manifest.json'),
              resolve(__dirname, 'dist/extension/manifest.json')
            );

            // Copy icons
            mkdirSync(resolve(__dirname, 'dist/extension/icons'), { recursive: true });
            ['16', '48', '128'].forEach(size => {
              copyFileSync(
                resolve(__dirname, `src/extension/icons/icon${size}.png`),
                resolve(__dirname, `dist/extension/icons/icon${size}.png`)
              );
            });
          }
        }
      }
    ],
    build: {
      outDir: isExtension ? 'dist/extension' : 'dist/web',
      emptyOutDir: true,
      rollupOptions: isExtension ? {
        input: {
          background: resolve(__dirname, 'src/extension/background.js'),
          popup: resolve(__dirname, 'src/extension/popup.html')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      } : undefined
    },
    server: {
      port: 3000,
    }
  };
});