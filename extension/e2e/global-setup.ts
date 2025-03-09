import { execSync } from 'child_process';
import { chromium, firefox, webkit } from '@playwright/test';

async function globalSetup() {
  console.log('Starting global setup...');

  try {
    // Build extension for all platforms
    console.log('Building extension for all platforms...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Extension built successfully');

    // Determine which browser to test based on project
    const browserType = process.env.BROWSER || 'chromium';
    console.log(`Setting up for browser: ${browserType}`);

    switch (browserType.toLowerCase()) {
      case 'chromium':
      case 'chrome':
        await setupChromium();
        break;
      case 'firefox':
        await setupFirefox();
        break;
      case 'webkit':
      case 'safari':
        await setupWebKit();
        break;
      default:
        console.log(`Unknown browser type: ${browserType}, defaulting to Chromium`);
        await setupChromium();
    }
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

async function setupChromium() {
  // Verify Chromium installation
  console.log('Checking Chromium installation...');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || 
    (await chromium.executablePath());
  console.log('Chromium executable path:', executablePath);

  // Test browser launch
  console.log('Testing Chromium launch...');
  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  console.log('Chromium launched successfully');

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
}

async function setupFirefox() {
  // Verify Firefox installation
  console.log('Checking Firefox installation...');
  const executablePath = process.env.PLAYWRIGHT_FIREFOX_PATH || 
    (await firefox.executablePath());
  console.log('Firefox executable path:', executablePath);

  // Test browser launch
  console.log('Testing Firefox launch...');
  const browser = await firefox.launch();
  console.log('Firefox launched successfully');

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
}

async function setupWebKit() {
  // Verify WebKit installation
  console.log('Checking WebKit installation...');
  const executablePath = process.env.PLAYWRIGHT_WEBKIT_PATH || 
    (await webkit.executablePath());
  console.log('WebKit executable path:', executablePath);

  // Test browser launch
  console.log('Testing WebKit launch...');
  const browser = await webkit.launch();
  console.log('WebKit launched successfully');

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
}

export default globalSetup;
