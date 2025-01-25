import { execSync } from 'child_process';
import { server } from '../config';

async function globalSetup() {
  // Build extension
  execSync('npm run build:extension', { stdio: 'inherit' });

  // Start dev server in background
  execSync(`PORT=${server.port} npm run dev > dev-server.log 2>&1 &`, { stdio: 'inherit' });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
}

export default globalSetup;