import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.[jt]s?(x)'],
    globals: true,
    setupFiles: ['./jest.setup.js', './jest.setup.extension.js']
  }
});