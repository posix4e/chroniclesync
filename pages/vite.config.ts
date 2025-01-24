import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const paths = {
  extension: resolve(__dirname, '../extension'),
  extensionDist: resolve(__dirname, '../extension/dist'),
  webDist: resolve(__dirname, 'dist'),
};

export default defineConfig(({ mode, command }) => {
  const isExtension = mode === 'extension';
  const isBackground = process.env.ENTRY === 'background';
  
  if (isExtension && isBackground) {
    return {
      build: {
        outDir: paths.extensionDist,
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/background.ts'),
          name: 'background',
          formats: ['iife'],
          fileName: () => 'background.js',
        }
      }
    };
  }

  return {
    plugins: [react()],
    build: {
      outDir: isExtension ? paths.extensionDist : paths.webDist,
      emptyOutDir: isExtension ? false : true,
      rollupOptions: {
        input: isExtension ? resolve(__dirname, 'src/popup.tsx') : resolve(__dirname, 'src/index.tsx'),
        output: {
          format: 'iife',
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    server: {
      port: 3000
    }
  };
});