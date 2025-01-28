import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { paths } from '../pages/config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: paths.extensionDist,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: paths.popup,
        background: paths.background
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    }
  }
});