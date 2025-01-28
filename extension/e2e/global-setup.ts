import { execSync } from 'child_process';

async function globalSetup() {
  execSync('npm run build:extension', { stdio: 'inherit' });
}

export default globalSetup;