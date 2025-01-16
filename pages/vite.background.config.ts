import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: `dist/${process.env.BROWSER || 'chrome'}`,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/extension/background.ts'),
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        dir: `dist/${process.env.BROWSER || 'chrome'}`,
        globals: {
          'browser-polyfill': 'browser'
        }
      }
    },
    sourcemap: true,
    target: 'es2015',
    minify: false
  }
});