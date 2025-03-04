import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy devtools files to dist
const files = ['devtools.html', 'panel.html'];
for (const file of files) {
    copyFileSync(
        join(__dirname, '..', 'src', 'devtools', file),
        join(__dirname, '..', 'dist', file)
    );
}