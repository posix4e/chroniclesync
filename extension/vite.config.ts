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
      'src/devtools/devtools.html',
      'src/devtools/panel.html'
    ];

    for (const file of files) {
      try {
        const destFile = file.startsWith('src/') ? file.replace('src/', '') : file;
        copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', destFile));
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
        devtools: resolve(__dirname, 'src/devtools/devtools.ts'),
        panel: resolve(__dirname, 'src/devtools/panel.ts')
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