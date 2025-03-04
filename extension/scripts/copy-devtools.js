import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy devtools.html to dist
copyFileSync(
    join(__dirname, '..', 'devtools.html'),
    join(__dirname, '..', 'dist', 'devtools.html')
);

// Copy panel.html to dist
copyFileSync(
    join(__dirname, '..', 'src', 'devtools', 'panel.html'),
    join(__dirname, '..', 'dist', 'panel.html')
);