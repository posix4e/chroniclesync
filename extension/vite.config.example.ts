import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { createCopyFilesPlugin, commonBuildOptions, commonServerOptions } from '../shared/build-utils';

// Files to copy after build
const filesToCopy = [
  'popup.html',
  'manifest.json',
  'popup.css',
  'settings.html',
  'settings.css',
  'bip39-wordlist.js',
  'history.html',
  'history.css',
  'devtools.html',
  'devtools.css'
];

export default defineConfig({
  plugins: [
    react(), 
    createCopyFilesPlugin(__dirname, resolve(__dirname, 'dist'), filesToCopy)
  ],
  build: {
    ...commonBuildOptions,
    outDir: 'dist',
    rollupOptions: {
      ...commonBuildOptions.rollupOptions,
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
        settings: resolve(__dirname, 'src/settings/index.ts'),
        history: resolve(__dirname, 'src/history.tsx'),
        devtools: resolve(__dirname, 'src/devtools.tsx'),
        'devtools-page': resolve(__dirname, 'src/devtools-page.ts'),
        'content-script': resolve(__dirname, 'src/content-script.ts')
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    }
  },
  server: {
    ...commonServerOptions,
    port: 54512
  }
});