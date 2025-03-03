import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

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
      'popup.html', 'manifest.json', 'popup.css', 
      'settings.html', 'settings.css', 'bip39-wordlist.js',
      'history.html', 'history.css'
    ];
    
    for (const file of filesToCopy) {
      if (existsSync(file)) {
        copyFileSync(file, `dist/${file}`);
      } else {
        console.warn(`Warning: File ${file} not found, skipping copy`);
      }
    }
    
    // Create a non-module version of content script for compatibility
    writeFileSync('dist/content.js', `
      // Non-module version of content script for compatibility
      (function() {
        // Wait for page to fully load
        if (document.readyState === 'complete') {
          sendContentToBackground();
        } else {
          window.addEventListener('load', function() {
            setTimeout(sendContentToBackground, 1000);
          });
        }

        function sendContentToBackground() {
          // Skip browser internal pages
          if (location.protocol === 'chrome:' || 
              location.protocol === 'chrome-extension:' || 
              location.protocol === 'about:') {
            return;
          }
          
          // Extract content
          const content = extractMainContent();
          
          // Send to background script
          if (content && content.trim().length > 100) {
            chrome.runtime.sendMessage({
              type: 'summarizeContent',
              url: window.location.href,
              title: document.title,
              content: content
            });
          }
        }

        function extractMainContent() {
          // Try common content selectors
          const selectors = [
            'article', 'main', '.content', '.article', '.post', 
            '[role="main"]', '#content', '#main'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent && element.textContent.trim().length > 100) {
              return element.textContent;
            }
          }
          
          // Fallback to paragraphs
          const paragraphs = Array.from(document.querySelectorAll('p'));
          if (paragraphs.length > 0) {
            return paragraphs
              .filter(p => p.textContent && p.textContent.trim().length > 40)
              .map(p => {
                const text = p.textContent;
                return text ? text.trim() : '';
              })
              .join('\\n\\n');
          }
          
          // Last resort: body text
          return document.body.textContent || '';
        }
      })();
    `);
  }
});

export default defineConfig({
  plugins: [react(), copyFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty the output directory to preserve our content.js
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'background.js'),
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
    port: 51555,
    host: '0.0.0.0',
    cors: true
  }
});