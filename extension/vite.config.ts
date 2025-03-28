import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

/**
 * Consolidated build configuration for ChronicleSync extension
 * - Handles all entry points
 * - Copies static assets
 * - Configures development server
 * - Includes test configuration
 */

// Custom plugin to copy files after build
const copyStaticAssets = () => ({
  name: 'copy-static-assets',
  closeBundle: () => {
    // Create dist directory if it doesn't exist
    if (!existsSync(resolve(__dirname, 'dist'))) {
      mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
    }
    
    // Static files to copy
    const files = [
      // HTML files
      'popup.html',
      'settings.html',
      'history.html',
      'devtools.html',
      
      // CSS files
      'popup.css',
      'settings.css',
      'history.css',
      'devtools.css',
      
      // Other assets
      'manifest.json',
      'bip39-wordlist.js'
    ];

    for (const file of files) {
      try {
        copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file));
        console.log(`Copied ${file} to dist`);
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}: ${error}`);
      }
    }
  }
});

export default defineConfig({
  plugins: [react(), copyStaticAssets()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Main extension components
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'src/background/index.ts'),
        settings: resolve(__dirname, 'src/settings/index.ts'),
        history: resolve(__dirname, 'src/history.tsx'),
        
        // DevTools components
        devtools: resolve(__dirname, 'src/devtools.tsx'),
        'devtools-page': resolve(__dirname, 'src/devtools-page.ts'),
        
        // Content script
        'content-script': resolve(__dirname, 'src/content-script.ts')
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    },
    // Ensure source maps for easier debugging
    sourcemap: true,
  },
  
  // Development server
  server: {
    port: 54512,
    host: '0.0.0.0',
    cors: true,
    open: '/popup.html'
  },
  
  // Test configuration (consolidated from vitest.config.ts)
  test: {
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.[jt]s?(x)'],
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    }
  }
});