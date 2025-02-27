import { build } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(__dirname, '../dist');

// Create dist directory if it doesn't exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

build({
  entryPoints: [resolve(__dirname, '../src/content.ts')],
  bundle: true,
  outfile: resolve(__dirname, '../dist/content.js'),
  format: 'iife',
  platform: 'browser',
  target: ['chrome58'],
  minify: true
}).catch(() => process.exit(1));