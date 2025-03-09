import { execSync } from 'child_process';
import { chromium, firefox, webkit } from '@playwright/test';

async function globalSetup() {
  console.log('Starting global setup...');

  try {
    // Build extension for all platforms
    console.log('Building extension for all platforms...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Determine which browsers to test based on environment
    const testChrome = !process.env.SKIP_CHROME;
    const testFirefox = !process.env.SKIP_FIREFOX;
    const testSafari = !process.env.SKIP_SAFARI && process.platform === 'darwin'; // Safari tests only on macOS
    
    console.log(`Testing browsers: Chrome=${testChrome}, Firefox=${testFirefox}, Safari=${testSafari}`);
    
    // Build platform-specific packages if needed
    if (process.env.BUILD_PACKAGES) {
      console.log('Building platform-specific packages...');
      if (testChrome) execSync('npm run build:chrome', { stdio: 'inherit' });
      if (testFirefox) execSync('npm run build:firefox', { stdio: 'inherit' });
      if (testSafari) execSync('npm run build:safari', { stdio: 'inherit' });
    }
    
    console.log('Extension built successfully');

    // Verify browser installations
    if (testChrome) {
      console.log('Checking Chromium installation...');
      const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || 
        (await chromium.executablePath());
      console.log('Chromium executable path:', chromiumPath);
      
      // Test Chromium launch
      console.log('Testing Chromium launch...');
      const chromeBrowser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const chromeContext = await chromeBrowser.newContext();
      const chromePage = await chromeContext.newPage();
      await chromePage.goto('about:blank');
      await chromePage.close();
      await chromeContext.close();
      await chromeBrowser.close();
      console.log('Chromium test successful');
    }
    
    if (testFirefox) {
      console.log('Checking Firefox installation...');
      const firefoxPath = process.env.PLAYWRIGHT_FIREFOX_PATH || 
        (await firefox.executablePath());
      console.log('Firefox executable path:', firefoxPath);
      
      // Test Firefox launch
      console.log('Testing Firefox launch...');
      const firefoxBrowser = await firefox.launch();
      const firefoxContext = await firefoxBrowser.newContext();
      const firefoxPage = await firefoxContext.newPage();
      await firefoxPage.goto('about:blank');
      await firefoxPage.close();
      await firefoxContext.close();
      await firefoxBrowser.close();
      console.log('Firefox test successful');
    }
    
    if (testSafari) {
      console.log('Checking WebKit installation...');
      const webkitPath = process.env.PLAYWRIGHT_WEBKIT_PATH || 
        (await webkit.executablePath());
      console.log('WebKit executable path:', webkitPath);
      
      // Test WebKit launch
      console.log('Testing WebKit launch...');
      const webkitBrowser = await webkit.launch();
      const webkitContext = await webkitBrowser.newContext();
      const webkitPage = await webkitContext.newPage();
      await webkitPage.goto('about:blank');
      await webkitPage.close();
      await webkitContext.close();
      await webkitBrowser.close();
      console.log('WebKit test successful');
    }
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

export default globalSetup;
