import { chromium, firefox, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Paths to extension builds
const CHROME_EXTENSION_PATH = path.join(__dirname, '../dist/chrome');
const FIREFOX_EXTENSION_PATH = path.join(__dirname, '../dist/firefox');
const FIREFOX_PROFILE_PATH = path.join(__dirname, 'firefox-profile');

async function globalSetup(config: FullConfig) {
  // Ensure Firefox profile directory exists
  if (!fs.existsSync(FIREFOX_PROFILE_PATH)) {
    fs.mkdirSync(FIREFOX_PROFILE_PATH, { recursive: true });
  }

  // For Firefox, we need to install the extension in the profile
  // This can be done using web-ext or by manually copying files
  if (fs.existsSync(FIREFOX_EXTENSION_PATH)) {
    console.log('Setting up Firefox extension...');
    
    // Create a temporary XPI file
    const xpiPath = path.join(__dirname, 'temp-extension.xpi');
    
    try {
      // Create XPI file (zip with .xpi extension)
      execSync(`cd ${FIREFOX_EXTENSION_PATH} && zip -r ${xpiPath} *`);
      
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
      
      console.log('Firefox extension setup complete');
    } catch (error) {
      console.error('Error setting up Firefox extension:', error);
    } finally {
      // Clean up temporary XPI file
      if (fs.existsSync(xpiPath)) {
        fs.unlinkSync(xpiPath);
      }
    }
  }

  // For Chrome, we don't need to do anything special here
  // The extension is loaded via command line arguments in the config
}

export default globalSetup;