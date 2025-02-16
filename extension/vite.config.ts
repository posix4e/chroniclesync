import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import wasm from 'vite-plugin-wasm';

// Custom plugin to copy files after build
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle: () => {
    // Ensure dist directory exists
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true });
    }
    
    // Copy HTML, CSS, and manifest files to dist
    const filesToCopy = [
      'popup.html',
      'manifest.json',
      'popup.css',
      'settings.html',
      'settings.css',
      'bip39-wordlist.js'
    ];
    
    filesToCopy.forEach(file => {
      if (existsSync(file)) {
        copyFileSync(file, `dist/${file}`);
      } else {
        console.warn(`Warning: ${file} not found`);
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