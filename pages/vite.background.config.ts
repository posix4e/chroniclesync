import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: `dist/${process.env.BROWSER || 'chrome'}`,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/extension/background.ts'),
        polyfill: resolve(__dirname, 'src/extension/browser-polyfill.js')
      },
      output: {
        entryFileNames: '[name].js',
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