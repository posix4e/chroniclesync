import { execSync } from 'child_process';

async function globalSetup() {
  // Build extension in a way that preserves source files
  execSync('npm run build:extension', { stdio: 'inherit' });
}

export default globalSetup;