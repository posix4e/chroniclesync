import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// Custom plugin to copy files after build
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle: () => {
    // Copy HTML, CSS, and manifest files to dist
    const files = [
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

    for (const file of files) {
      try {
        copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file));
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}: ${error}`);
      }
    }
  }
});

export default defineConfig({
  plugins: [react(), copyFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
        settings: resolve(__dirname, 'src/settings/index.ts'),
        history: resolve(__dirname, 'src/history.tsx'),
        devtools: resolve(__dirname, 'src/devtools.tsx'),
        'devtools-page': resolve(__dirname, 'src/devtools-page.ts')
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