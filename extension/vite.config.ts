import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, writeFileSync } from 'fs';

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
    copyFileSync('history.html', 'dist/history.html');
    copyFileSync('history.css', 'dist/history.css');
    
    // Create a non-module version of content script for compatibility
    writeFileSync('dist/content.js', `
      // Non-module version of content script for compatibility
      (async () => {
        try {
          // Wait for page to be fully loaded
          if (document.readyState !== 'complete') {
            await new Promise(resolve => {
              window.addEventListener('load', resolve, { once: true });
            });
          }
          
          // Skip browser internal pages
          if (location.protocol === 'chrome:' || 
              location.protocol === 'about:' || 
              location.protocol === 'chrome-extension:') {
            return;
          }
          
          // Send message to background script to extract and summarize content
          chrome.runtime.sendMessage({
            type: 'extractAndSummarize',
            url: window.location.href,
            title: document.title
          });
        } catch (error) {
          console.error('ChronicleSync content script error:', error);
        }
      })();
    `);
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
        content: resolve(__dirname, 'src/content.ts')
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
    port: 52272,
    host: '0.0.0.0',
    cors: true
  }
});