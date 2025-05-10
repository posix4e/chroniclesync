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

    // Get the current mode from the command line arguments
    const args = process.argv.slice(2);
    const modeIndex = args.findIndex(arg => arg === '--mode');
    const mode = modeIndex !== -1 && modeIndex + 1 < args.length ? args[modeIndex + 1] : null;
    
    // Determine the output directory based on the mode
    const outDir = mode === 'firefox' ? 'dist-firefox' : 'dist';
    // eslint-disable-next-line no-console
    console.log(`Copying files to ${outDir} directory (mode: ${mode || 'default'})`);

    for (const file of files) {
      try {
        copyFileSync(resolve(__dirname, file), resolve(__dirname, outDir, file));
        // eslint-disable-next-line no-console
        console.log(`Copied ${file} to ${outDir}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Warning: Could not copy ${file}: ${error}`);
      }
    }
  }
});

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox';
  
  return {
    plugins: [react(), copyFiles()],
    build: {
      outDir: isFirefox ? 'dist-firefox' : 'dist',
      emptyOutDir: true,
      target: isFirefox ? 'es2015' : 'esnext',
      rollupOptions: {
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
          format: 'es' as const,
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          inlineDynamicImports: false
        }
      }
    },
    server: {
      port: 54512,
      host: '0.0.0.0',
      cors: true
    }
  };
});