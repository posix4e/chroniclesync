import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-safari',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        'content-script': resolve(__dirname, 'src/content-script.ts'),
        popup: resolve(__dirname, 'popup.html'),
        settings: resolve(__dirname, 'settings.html'),
        history: resolve(__dirname, 'history.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    target: 'es2015',
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
  },
  define: {
    'process.env.PLATFORM': JSON.stringify('safari'),
  },
});