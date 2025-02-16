import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// Custom plugin to copy files after build
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle: () => {
    // Copy HTML, CSS, and manifest files to dist
    copyFileSync('popup.html', 'dist/popup.html');
    copyFileSync('manifest.json', 'dist/manifest.json');
    copyFileSync('popup.css', 'dist/popup.css');
    copyFileSync('settings.html', 'dist/settings.html');
    copyFileSync('settings.css', 'dist/settings.css');
    copyFileSync('bip39-wordlist.js', 'dist/bip39-wordlist.js');
  }
});

export default defineConfig({
  plugins: [react(), copyFiles()],
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'background.js'),
        settings: resolve(__dirname, 'src/settings/index.ts')
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
    port: 54512,
    host: '0.0.0.0',
    cors: true
  }
});