import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';

  return {
    plugins: [react()],
    build: {
      outDir: isExtension ? '../extension/dist' : 'dist',
      ...(isExtension && {
        rollupOptions: {
          input: {
            popup: resolve(__dirname, 'src/popup.tsx')
          },
          output: {
            entryFileNames: '[name].js',
            format: 'iife',
            inlineDynamicImports: true
          }
        }
      })
    },
    server: {
      port: 3000,
    }
  };
});