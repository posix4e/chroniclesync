import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.[jt]s?(x)', '**/src/**/*.test.[jt]s?(x)'],
    globals: true,
    setupFiles: ['./jest.setup.js', './jest.setup.extension.js'],
    css: true,
    hookTimeout: 20000,
    testTimeout: 20000
  }
});