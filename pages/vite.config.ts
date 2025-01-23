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
        input: isExtension ? paths.popup : 'src/index.tsx',
        output: {
          format: isExtension ? 'iife' : 'es',
          inlineDynamicImports: isExtension
        }
      }
    },
    server: {
      port: server.port
    }
  };
});