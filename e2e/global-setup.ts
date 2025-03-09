import { execSync } from 'child_process';
import { chromium, firefox, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Paths to extension builds
const CHROME_EXTENSION_PATH = path.join(__dirname, '../dist/chrome');
const FIREFOX_EXTENSION_PATH = path.join(__dirname, '../dist/firefox');
const FIREFOX_PROFILE_PATH = path.join(__dirname, './firefox-profile');

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');

  try {
    // Create build directories
    console.log('Creating build directories...');
    if (!fs.existsSync(path.join(__dirname, '../dist'))) {
      fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
    }
    if (!fs.existsSync(CHROME_EXTENSION_PATH)) {
      fs.mkdirSync(CHROME_EXTENSION_PATH, { recursive: true });
    }
    if (!fs.existsSync(FIREFOX_EXTENSION_PATH)) {
      fs.mkdirSync(FIREFOX_EXTENSION_PATH, { recursive: true });
    }
    
    // Ensure Firefox profile directory exists
    if (!fs.existsSync(FIREFOX_PROFILE_PATH)) {
      fs.mkdirSync(FIREFOX_PROFILE_PATH, { recursive: true });
    }

    // Build extension for Chrome
    console.log('Building Chrome extension...');
    try {
      execSync('cd ../extension && npm run build', { stdio: 'inherit' });
      
      // Copy built files to Chrome directory
      execSync(`cp -r ../extension/dist/* ${CHROME_EXTENSION_PATH}`, { stdio: 'inherit' });
      console.log('Chrome extension built successfully');
    } catch (error) {
      console.error('Error building Chrome extension:', error);
    }

    // Build extension for Firefox
    console.log('Building Firefox extension...');
    try {
      // Copy built files to Firefox directory
      execSync(`cp -r ../extension/dist/* ${FIREFOX_EXTENSION_PATH}`, { stdio: 'inherit' });
      
      // Copy Firefox manifest
      execSync(`cp ../platforms/firefox/manifest.json ${FIREFOX_EXTENSION_PATH}`, { stdio: 'inherit' });
      console.log('Firefox extension built successfully');
    } catch (error) {
      console.error('Error building Firefox extension:', error);
    }

    // For Firefox, we need to install the extension in the profile
    console.log('Setting up Firefox extension...');
    try {
      // Create a temporary XPI file
      const xpiPath = path.join(__dirname, 'temp-extension.xpi');
      
      // Create XPI file (zip with .xpi extension)
      execSync(`cd ${FIREFOX_EXTENSION_PATH} && zip -r ${xpiPath} *`, { stdio: 'inherit' });
      
      // Launch Firefox with the profile to install the extension
      const browser = await firefox.launch({
        headless: true,
        firefoxUserPrefs: {
          'extensions.autoDisableScopes': 0,
          'extensions.enableScopes': 15,
        },
        args: [
          '-profile',
          FIREFOX_PROFILE_PATH,
        ],
      });
      
      // Close the browser - the extension is now installed in the profile
      await browser.close();
      
      // Clean up temporary XPI file
      if (fs.existsSync(xpiPath)) {
        fs.unlinkSync(xpiPath);
      }
      
      console.log('Firefox extension setup complete');
    } catch (error) {
      console.error('Error setting up Firefox extension:', error);
    }

    // Verify browser installations
    console.log('Checking browser installations...');
    
    // Test Chromium
    try {
      const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || 
        (await chromium.executablePath());
      console.log('Chromium executable path:', chromiumPath);
      
      const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      await browser.close();
      console.log('Chromium test successful');
    } catch (error) {
      console.error('Error testing Chromium:', error);
    }
    
    // Test Firefox
    try {
      const firefoxPath = process.env.PLAYWRIGHT_FIREFOX_PATH || 
        (await firefox.executablePath());
      console.log('Firefox executable path:', firefoxPath);
      
      const browser = await firefox.launch();
      await browser.close();
      console.log('Firefox test successful');
    } catch (error) {
      console.error('Error testing Firefox:', error);
    }
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }

  console.log('Global setup completed');
}

export default globalSetup;
