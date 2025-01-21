import fs from 'fs';
import path from 'path';

async function globalSetup() {
  // Create test-results directory
  const testResultsDir = path.join(process.cwd(), 'test-results');
  fs.mkdirSync(testResultsDir, { recursive: true });
}

export default globalSetup;