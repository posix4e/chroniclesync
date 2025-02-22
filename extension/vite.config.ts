import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'path';
import { copyFileSync, existsSync } from 'fs';
import wasm from 'vite-plugin-wasm';

// Custom plugin to copy files after build
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle: () => {
    // Copy HTML, CSS, and manifest files to dist if they exist
    const filesToCopy = [
      'popup.html',
      'manifest.json',
      'popup.css',
      'settings.html',
      'settings.css',
      'bip39-wordlist.js'
    ];

    const rootDir = __dirname;
    const distDir = join(rootDir, 'dist');

    filesToCopy.forEach(file => {
      const srcPath = join(rootDir, file);
      const destPath = join(distDir, file);
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
      }
    });
  }
});

export default defineConfig({
  plugins: [wasm(), react(), copyFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
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