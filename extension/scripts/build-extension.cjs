/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
  ['popup.html', 'popup.html'],
  ['popup.css', 'popup.css'],
  ['settings.html', 'settings.html'],
  ['settings.css', 'settings.css'],
  ['history.html', 'history.html'],
  ['history.css', 'history.css'],
  ['bip39-wordlist.js', 'bip39-wordlist.js'],
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
  [join('dist', 'settings.js'), 'settings.js'],
  [join('dist', 'history.js'), 'history.js'],
  [join('dist', 'content.js'), 'content.js'],
  [join('dist', 'assets'), 'assets']
];

async function main() {
  try {
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Copy necessary files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(PACKAGE_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // List the files in the package directory
    console.log('Files in package directory:');
    await execAsync(`ls -la "${PACKAGE_DIR}"`).then(({stdout}) => console.log(stdout));
    
    // Check if content.js is in the dist directory
    console.log('Checking for content.js:');
    await execAsync(`ls -la "${ROOT_DIR}/dist/content.js"`).then(
      ({stdout}) => console.log('Found content.js:', stdout),
      (err) => console.log('content.js not found:', err.message)
    );
    
    // Copy content.js to package directory if it exists
    try {
      await cp(
        join(ROOT_DIR, 'dist', 'content.js'),
        join(PACKAGE_DIR, 'content.js')
      );
      console.log('Copied content.js to package directory');
    } catch (err) {
      console.warn(`Warning: Could not copy content.js: ${err.message}`);
    }
    
    // Create a tar.gz file instead of zip
    console.log('Creating tar.gz file...');
    await execAsync(`tar -czf "${ROOT_DIR}/chrome-extension.tar.gz" -C "${PACKAGE_DIR}" .`);
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('Extension package created: chrome-extension.tar.gz');
  } catch (error) {
    console.error('Error building extension:', error);
    process.exit(1);
  }
}

main();