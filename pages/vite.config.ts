import { defineConfig, build } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig(({ command }) => {
  const target = process.env.BUILD_TARGET || 'web';
  const isExtension = target === 'extension';

  return {
    plugins: [react()],
    build: {
      outDir: isExtension ? paths.extensionDist : paths.webDist,
      emptyOutDir: true,
      rollupOptions: {
        input: isExtension ? {
          popup: paths.popup,
          background: paths.background,
          styles: paths.styles
        } : 'src/index.tsx',
        output: [
          {
            // ES modules for popup
            format: 'es',
            entryFileNames: chunk => chunk.name === 'background' ? '[name].js' : '[name].[hash].js',
            assetFileNames: 'assets/[name].[ext]',
            inlineDynamicImports: false
          },
          {
            // IIFE for background script
            format: 'iife',
            entryFileNames: '[name].js',
            assetFileNames: 'assets/[name].[ext]',
            inlineDynamicImports: true,
            include: /background\.js$/
          }
        ]
      }
    },
    server: {
      port: server.port
    }
  };
});