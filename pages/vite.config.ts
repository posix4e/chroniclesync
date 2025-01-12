import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync, copyFileSync, mkdirSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';
  const browser = process.env.BROWSER || 'chrome';

  return {
    plugins: [
      react(),
      {
        name: 'extension-manifest',
        writeBundle: () => {
          if (isExtension) {
            // Copy static files
            const staticFiles = [
              [browser === 'chrome' ? 'manifest.v3.json' : 'manifest.v2.json', 'manifest.json'],
              ['popup.html', 'popup.html'],
              ['background.js', 'background.js'],
              ['popup.js', 'popup.js'],
              ['browser-polyfill.js', 'browser-polyfill.js']
            ];

            for (const [src, dest] of staticFiles) {
              copyFileSync(
                resolve(__dirname, `src/extension/${src}`),
                resolve(__dirname, `dist/${browser}/${dest}`)
              );
            }

            // Copy browser-specific files
            if (browser === 'safari') {
              writeFileSync(
                resolve(__dirname, 'dist/safari/Info.plist'),
                `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>dev.all-hands.chroniclesync</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>SFSafariWebExtensionConverterVersion</key>
    <string>14.0</string>
</dict>
</plist>`
              );
            }

            // Copy icons
            mkdirSync(resolve(__dirname, `dist/${browser}/icons`), { recursive: true });
            ['16', '48', '128'].forEach(size => {
              copyFileSync(
                resolve(__dirname, `src/extension/icons/icon${size}.png`),
                resolve(__dirname, `dist/${browser}/icons/icon${size}.png`)
              );
            });
          }
        }
      }
    ],
    build: {
      outDir: isExtension ? `dist/${browser}` : 'dist/web',
      emptyOutDir: true,
      rollupOptions: isExtension ? {
        input: {
          background: resolve(__dirname, 'src/extension/background.js'),
          popup: resolve(__dirname, 'src/extension/popup.js')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      } : undefined
    },
    server: {
      port: 3000,
    }
  };
});