import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: 'src/background.ts',
        content: 'src/content.ts'
      },
      output: {
        entryFileNames: '[name].js',
        dir: 'extension/dist'
      }
    }
  }
});