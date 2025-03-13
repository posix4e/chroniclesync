import { execSync } from 'child_process';
import { chromium, firefox, webkit } from '@playwright/test';

async function globalSetup() {
  console.log('Starting global setup...');
  const browserType = process.env.BROWSER || 'chromium';
  
  try {
    // Build extension
    console.log('Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Extension built successfully');

    // Package extensions
    console.log('Packaging extensions...');
    execSync('NODE_OPTIONS="--experimental-vm-modules --no-warnings" node scripts/build-extension.cjs', { stdio: 'inherit' });
    console.log('Extensions packaged successfully');

    // Test browser launch based on selected browser
    if (browserType === 'firefox') {
      await testFirefoxLaunch();
    } else if (browserType === 'webkit') {
      await testWebKitLaunch();
    } else {
      await testChromiumLaunch();
    }
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

async function testChromiumLaunch() {
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
}

async function testFirefoxLaunch() {
  // Verify Firefox installation
  console.log('Checking Firefox installation...');
  const executablePath = process.env.PLAYWRIGHT_FIREFOX_PATH || 
    (await firefox.executablePath());
  console.log('Firefox executable path:', executablePath);

  // Test browser launch
  console.log('Testing Firefox launch...');
  const browser = await firefox.launch({
    args: [
      '-wait-for-browser',
      '-foreground',
      '-no-remote',
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
}

async function testWebKitLaunch() {
  // Verify WebKit installation
  console.log('Checking WebKit installation...');
  const executablePath = process.env.PLAYWRIGHT_WEBKIT_PATH || 
    (await webkit.executablePath());
  console.log('WebKit executable path:', executablePath);

  // Test browser launch
  console.log('Testing WebKit launch...');
  const browser = await webkit.launch({
    args: [
      '--enable-extension-support',
    ],
  });
  console.log('Browser launched successfully');

  // Create context with iOS Safari settings
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone 8 dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
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
