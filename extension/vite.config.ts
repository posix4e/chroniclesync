import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy files after build
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle: () => {
    // Copy HTML, CSS, and manifest files to dist
    const files = [
      'popup.html',
      'manifest.json',
      'popup.css',
      'settings.html',
      'settings.css',
      'bip39-wordlist.js',
      'history.html',
      'history.css',
      'devtools.html',
      'devtools.css'
    ];

    // Copy regular files
    for (const file of files) {
      try {
        copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file));
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}: ${error}`);
      }
    }

    // Copy ONNX files
    const onnxDir = resolve(__dirname, 'dist', 'onnx');
    if (!existsSync(onnxDir)) {
      mkdirSync(onnxDir, { recursive: true });
    }

    const onnxFiles = [
      'ort-wasm-simd-threaded.wasm',
      'ort-wasm-simd-threaded.jsep.wasm'
    ];

    for (const file of onnxFiles) {
      try {
        copyFileSync(
          resolve(__dirname, 'onnx', file),
          resolve(onnxDir, file)
        );
        console.log(`Copied ONNX file: ${file}`);
      } catch (error) {
        console.warn(`Warning: Could not copy ONNX file ${file}: ${error}`);
      }
    }

    // Copy model files
    const modelDir = resolve(__dirname, 'dist', 'models', 'bart-small-cnn');
    if (!existsSync(modelDir)) {
      mkdirSync(modelDir, { recursive: true });
    }

    const modelFiles = [
      'tokenizer.json',
      'config.json',
      'model.onnx'
    ];

    for (const file of modelFiles) {
      try {
        copyFileSync(
          resolve(__dirname, 'models', 'bart-small-cnn', file),
          resolve(modelDir, file)
        );
        console.log(`Copied model file: ${file}`);
      } catch (error) {
        console.warn(`Warning: Could not copy model file ${file}: ${error}`);
      }
    }
  }
});

export default defineConfig({
  plugins: [react(), copyFiles()],
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
        settings: resolve(__dirname, 'src/settings/index.ts'),
        history: resolve(__dirname, 'src/history.tsx'),
        devtools: resolve(__dirname, 'src/devtools.tsx'),
        'devtools-page': resolve(__dirname, 'src/devtools-page.ts')
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
        inlineDynamicImports: false
      }
    }
  },
  server: {
    port: 54512,
    host: '0.0.0.0',
    cors: true
  }
});