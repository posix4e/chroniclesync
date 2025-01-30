import { execSync, spawn } from 'child_process';
import { chromium } from '@playwright/test';
import path from 'path';

async function globalSetup() {
  console.log('Starting global setup...');

  try {
    // Build extension
    console.log('Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Extension built successfully');

    // Start mock server
    console.log('Starting mock server...');
    const mockServerPath = path.join(process.cwd(), 'e2e', 'mock-server.js');
    const mockServer = spawn('node', [mockServerPath], {
      stdio: 'inherit',
      detached: true,
    });
    mockServer.unref();
    console.log('Mock server started');

    // Verify Chromium installation
    console.log('Checking Chromium installation...');
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || 
      (await chromium.executablePath());
    console.log('Chromium executable path:', executablePath);

    // Test browser launch
    console.log('Testing browser launch...');
    const browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    console.log('Browser launched successfully');

    const context = await browser.newContext();
    console.log('Context created successfully');

    const page = await context.newPage();
    console.log('Page created successfully');

    await page.goto('about:blank');
    console.log('Navigation successful');

    await page.close();
    await context.close();
    await browser.close();
    console.log('Test browser closed successfully');
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

export default globalSetup;
