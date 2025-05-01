import { defineConfig } from 'vite';
import crxPlugin from 'vite-plugin-chrome-extension';

export default defineConfig({
  plugins: [crxPlugin({ manifest: './src/manifest.json' })],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './src/manifest.json',
    },
  },
  server: {
    host: true,
    port: 12000,
    allowedHosts: true,
    cors: true
  }
});