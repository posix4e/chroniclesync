import { defineConfig, build } from 'vite';
import react from '@vitejs/plugin-react';
import { paths, server } from './config';

export default defineConfig(({ command }) => {
  if (command === 'build') {
    // Run two separate builds
    const target = process.env.BUILD_TARGET || 'both';
    
    if (target === 'web' || target === 'both') {
      console.log('Building web app...');
      build({
        build: {
          outDir: paths.webDist,
          rollupOptions: {
            input: 'src/index.tsx',
            output: {
              format: 'es'
            }
          }
        }
      });
    }
    
    if (target === 'extension' || target === 'both') {
      console.log('Building extension...');
      build({
        build: {
          outDir: paths.extensionDist,
          rollupOptions: {
            input: paths.popup,
            output: {
              format: 'iife',
              inlineDynamicImports: true
            }
          }
        }
      });
    }
  }

  return {
    plugins: [react()],
    server: {
      port: server.port
    }
  };
});