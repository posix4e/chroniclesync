import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import * as fs from 'fs';

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
              ['browser-polyfill.js', 'browser-polyfill.js']
            ].map(([src, dest]) => [
              resolve(__dirname, `src/extension/${src}`),
              resolve(__dirname, `dist/${browser}/${dest}`)
            ]);

            // For Safari, we need to ensure all JS files are CommonJS modules
            if (browser === 'safari') {
              const jsFiles = ['background.ts', 'popup.js', 'browser-polyfill.js'];
              for (const file of jsFiles) {
                const srcPath = resolve(__dirname, `src/extension/${file}`);
                const destPath = resolve(__dirname, `dist/${browser}/${file}`);
                console.log(`Copying ${file}:`, { src: srcPath, dest: destPath });
                
                if (!fs.existsSync(srcPath)) {
                  console.error(`Source file not found: ${srcPath}`);
                  throw new Error(`Required file not found: ${file}`);
                }

                const content = fs.readFileSync(srcPath, 'utf8');
                console.log(`Content of ${file}:`, content);
                fs.writeFileSync(destPath, content);
              }
            }

            // Debug output
            console.log('Extension files:');
            console.log('Source directory:', resolve(__dirname, 'src/extension'));
            console.log('Destination directory:', resolve(__dirname, `dist/${browser}`));
            console.log('Files to copy:', staticFiles);

            for (const [src, dest] of staticFiles) {
              fs.copyFileSync(src, dest);
            }

            // Copy browser-specific files
            if (browser === 'safari') {
              fs.writeFileSync(
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
            const iconsDir = resolve(__dirname, `dist/${browser}/icons`);
            fs.mkdirSync(iconsDir, { recursive: true });
            ['16', '48', '128'].forEach(size => {
              const srcIcon = resolve(__dirname, `src/extension/icons/icon${size}.png`);
              const destIcon = resolve(__dirname, `dist/${browser}/icons/icon${size}.png`);
              console.log(`Copying icon ${size}:`, { src: srcIcon, dest: destIcon });
              if (!fs.existsSync(srcIcon)) {
                console.error(`Icon not found: ${srcIcon}`);
                throw new Error(`Required icon not found: icon${size}.png`);
              }
              fs.copyFileSync(srcIcon, destIcon);
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
          background: resolve(__dirname, 'src/extension/background.ts'),
          popup: resolve(__dirname, 'src/extension/popup.tsx')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          format: 'iife',
          inlineDynamicImports: true,
          globals: {
            'browser-polyfill': 'browser',
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        },
        external: ['browser-polyfill', 'react', 'react-dom']
      } : undefined,
      cssCodeSplit: false,
      sourcemap: true,
      target: 'es2015',
      minify: false,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        exclude: ['browser-polyfill', 'react', 'react-dom']
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['browser-polyfill']
    },
    resolve: {
      alias: {
        'react': 'https://unpkg.com/react@18/umd/react.development.js',
        'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.development.js'
      }
    },
    server: {
      port: 3000,
    }
  };
});
