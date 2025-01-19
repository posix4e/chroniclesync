import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Create separate configs for popup and background
const popupConfig: UserConfig = {
  plugins: [react()],
  build: {
    outDir: '../extension/dist',
    lib: {
      entry: 'src/popup.tsx',
      name: 'popup',
      formats: ['iife'] as const,
      fileName: () => 'popup.js'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
};

const backgroundConfig: UserConfig = {
  build: {
    outDir: '../extension/dist',
    lib: {
      entry: '../extension/src/background.ts',
      name: 'background',
      formats: ['iife'] as const,
      fileName: () => 'background.js'
    }
  }
};

// Export the popup config by default, and use a command line flag to choose which config to use
export default defineConfig(({ mode }): UserConfig => {
  if (mode === 'background') {
    return backgroundConfig;
  }
  return popupConfig;
});