/* eslint-disable no-console */
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory

// Get browser target from command line argument or default to all
const browserTarget = process.argv[2] || 'all';

async function packageChrome() {
  try {
    console.log('Packaging Chrome extension...');
    await execAsync('npm run build:chrome', { cwd: ROOT_DIR });
    console.log('Chrome extension packaged successfully');
    return true;
  } catch (error) {
    console.error('Error packaging Chrome extension:', error);
    return false;
  }
}

async function packageFirefox() {
  try {
    console.log('Packaging Firefox extension...');
    await execAsync('npm run build:firefox', { cwd: ROOT_DIR });
    console.log('Firefox extension packaged successfully');
    return true;
  } catch (error) {
    console.error('Error packaging Firefox extension:', error);
    return false;
  }
}

async function packageSafari() {
  try {
    console.log('Packaging Safari extension...');
    
    // First build the Safari extension
    await execAsync('npm run build:safari', { cwd: ROOT_DIR });
    
    // Check if we're running on macOS (required for Safari extension packaging)
    const platform = process.platform;
    if (platform !== 'darwin') {
      console.warn('Safari extension packaging requires macOS. Files have been built but not packaged.');
      return true;
    }
    
    // Check if the Safari extension directory exists
    const safariExtensionDir = join(ROOT_DIR, 'ChronicleSync');
    if (!fs.existsSync(safariExtensionDir)) {
      console.warn('Safari extension directory not found. Files have been built but not packaged.');
      return true;
    }
    
    // On macOS, we could use xcodebuild to build the Safari extension
    // This would require Xcode to be installed
    console.log('Safari extension files have been built and copied to the Xcode project.');
    console.log('To build the Safari extension package, use Xcode or the GitHub Actions workflow.');
    
    return true;
  } catch (error) {
    console.error('Error packaging Safari extension:', error);
    return false;
  }
}

async function main() {
  let success = true;
  
  if (browserTarget === 'all' || browserTarget === 'chrome') {
    success = await packageChrome() && success;
  }
  
  if (browserTarget === 'all' || browserTarget === 'firefox') {
    success = await packageFirefox() && success;
  }
  
  if (browserTarget === 'all' || browserTarget === 'safari') {
    success = await packageSafari() && success;
  }
  
  if (success) {
    console.log('All requested extension packages created successfully');
  } else {
    console.error('Some extension packages failed to build');
    process.exit(1);
  }
}

main();