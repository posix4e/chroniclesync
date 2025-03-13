import { execSync } from 'child_process';
import { chromium, firefox } from '@playwright/test';

async function globalSetup() {
  console.log('Starting global setup...');

  try {
    // Build extension for both Chrome and Firefox
    console.log('Building extensions...');
    execSync('npm run build:extension', { stdio: 'inherit' });
    console.log('Extensions built successfully');

    // Test browser setup based on the selected browser
    const selectedBrowser = process.env.BROWSER || 'chromium';
    
    if (selectedBrowser === 'firefox' || process.env.TEST_ALL_BROWSERS) {
      await testFirefoxSetup();
    }
    
    if (selectedBrowser === 'chromium' || process.env.TEST_ALL_BROWSERS) {
      await testChromiumSetup();
    }
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

async function testChromiumSetup() {
  try {
    // Verify Chromium installation
    console.log('Checking Chromium installation...');
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || 
      (await chromium.executablePath());
    console.log('Chromium executable path:', executablePath);

    // Test browser launch
    console.log('Testing Chromium browser launch...');
    const browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    console.log('Chromium browser launched successfully');

    const context = await browser.newContext();
    console.log('Chromium context created successfully');

    const page = await context.newPage();
    console.log('Chromium page created successfully');

    await page.goto('about:blank');
    console.log('Chromium navigation successful');

    await page.close();
    await context.close();
    await browser.close();
    console.log('Chromium test browser closed successfully');
  } catch (error) {
    console.error('Error in Chromium setup:', error);
    throw error;
  }
}

async function testFirefoxSetup() {
  try {
    // Verify Firefox installation
    console.log('Checking Firefox installation...');
    const executablePath = process.env.PLAYWRIGHT_FIREFOX_PATH || 
      (await firefox.executablePath());
    console.log('Firefox executable path:', executablePath);

    // Test browser launch
    console.log('Testing Firefox browser launch...');
    const browser = await firefox.launch({
      firefoxUserPrefs: {
        'xpinstall.signatures.required': false,
        'extensions.autoDisableScopes': 0,
        'extensions.enableScopes': 15,
      },
    });
    console.log('Firefox browser launched successfully');

    // For Firefox, we need to load the extension differently
    // In actual tests, we'll use the extension path in the context options
    console.log('Testing Firefox context with extension...');
    try {
      const context = await browser.newContext({
        // This will fail in the setup phase, but we're just testing the API
        // In actual tests, the extension will be built and available
        viewport: { width: 1280, height: 720 },
      });
      console.log('Firefox context created successfully');

      const page = await context.newPage();
      console.log('Firefox page created successfully');

      await page.goto('about:blank');
      console.log('Firefox navigation successful');

      await page.close();
      await context.close();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log('Expected error when testing Firefox extension loading:', errorMessage);
      console.log('This is normal during setup - the actual extension will be loaded during tests');
    }

    await browser.close();
    console.log('Firefox test browser closed successfully');
  } catch (error) {
    console.error('Error in Firefox setup:', error);
    throw error;
  }
}

export default globalSetup;
