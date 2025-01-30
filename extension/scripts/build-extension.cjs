/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = __dirname;
const PACKAGE_DIR = join(ROOT_DIR, '..', 'package');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
  ['popup.html', 'popup.html'],
  ['popup.css', 'popup.css'],
  ['settings.css', 'settings.css'],
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
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
    await execAsync('npm run build', { cwd: join(ROOT_DIR, '..') });
    
    // Copy necessary files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, '..', src),
        join(PACKAGE_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Create zip file
    console.log('Creating zip file...');
    await execAsync(`cd "${PACKAGE_DIR}" && zip -r ../chrome-extension.zip ./*`);
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('Extension package created: chrome-extension.zip');
  } catch (error) {
    console.error('Error building extension:', error);
    process.exit(1);
  }
}

main();