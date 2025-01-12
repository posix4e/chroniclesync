import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import * as fs from 'fs';

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
            // Copy static files
            const staticFiles = [
              ['manifest.json', 'manifest.json'],
              ['popup.html', 'popup.html']
            ];

            for (const [src, dest] of staticFiles) {
              fs.copyFileSync(
                resolve(__dirname, `src/extension/${src}`),
                resolve(__dirname, `dist/extension/${dest}`)
              );
            }

            // Copy icons
            fs.mkdirSync(resolve(__dirname, 'dist/extension/icons'), { recursive: true });
            ['16', '48', '128'].forEach(size => {
              fs.copyFileSync(
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
          popup: resolve(__dirname, 'src/extension/popup.js')
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