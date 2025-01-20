import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Copy manifest and popup to dist
const copyFiles = () => ({
  name: 'copy-files',
  writeBundle: () => {
    const files = [
      ['public/manifest.json', 'dist/extension/manifest.json'],
      ['public/popup.html', 'dist/extension/popup.html']
    ];
    
    files.forEach(([src, dest]) => {
      fs.mkdirSync(resolve(__dirname, 'dist/extension'), { recursive: true });
      fs.copyFileSync(
        resolve(__dirname, src),
        resolve(__dirname, dest)
      );
    });
  }
});

export default defineConfig({
  plugins: [react(), copyFiles()],
  build: {
    outDir: 'dist/extension',
    rollupOptions: {
      input: {
        popup: 'src/popup.tsx',
        background: 'src/extension/background.ts'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});