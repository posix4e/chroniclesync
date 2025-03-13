/* eslint-disable no-console */
const { mkdir, rm, cp, readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const CHROME_PACKAGE_DIR = join(ROOT_DIR, 'package-chrome');
const FIREFOX_PACKAGE_DIR = join(ROOT_DIR, 'package-firefox');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
  ['popup.html', 'popup.html'],
  ['popup.css', 'popup.css'],
  ['settings.html', 'settings.html'],
  ['settings.css', 'settings.css'],
  ['history.html', 'history.html'],
  ['history.css', 'history.css'],
  ['devtools.html', 'devtools.html'],
  ['devtools.css', 'devtools.css'],
  ['bip39-wordlist.js', 'bip39-wordlist.js'],
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
  [join('dist', 'settings.js'), 'settings.js'],
  [join('dist', 'history.js'), 'history.js'],
  [join('dist', 'devtools.js'), 'devtools.js'],
  [join('dist', 'devtools-page.js'), 'devtools-page.js'],
  [join('dist', 'content-script.js'), 'content-script.js'],
  [join('dist', 'assets'), 'assets']
];

async function createFirefoxManifest(sourcePath, destPath) {
  const manifest = JSON.parse(await readFile(sourcePath, 'utf8'));
  
  // Firefox-specific adjustments
  if (manifest.background && manifest.background.service_worker) {
    // Firefox uses a different background script format
    manifest.background = {
      scripts: [manifest.background.service_worker],
      type: "module"
    };
  }
  
  // Firefox requires applications key for add-on ID
  manifest.browser_specific_settings = {
    gecko: {
      id: "chroniclesync@chroniclesync.xyz"
    }
  };
  
  await writeFile(destPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Created Firefox-compatible manifest.json');
}

async function buildExtension(browser) {
  const packageDir = browser === 'chrome' ? CHROME_PACKAGE_DIR : FIREFOX_PACKAGE_DIR;
  const zipName = browser === 'chrome' ? 'chrome-extension.zip' : 'firefox-extension.xpi';
  
  try {
    // Clean up any existing package directory
    await rm(packageDir, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(packageDir, { recursive: true });
    
    // Copy necessary files
    console.log(`Copying files for ${browser}...`);
    for (const [src, dest] of filesToCopy) {
      if (src === 'manifest.json' && browser === 'firefox') {
        // Special handling for Firefox manifest
        await createFirefoxManifest(join(ROOT_DIR, src), join(packageDir, dest));
        continue;
      }
      
      await cp(
        join(ROOT_DIR, src),
        join(packageDir, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Create zip file
    console.log(`Creating ${browser} package...`);
    await execAsync(`cd "${packageDir}" && zip -r ../${zipName} ./*`);
    
    // Clean up
    await rm(packageDir, { recursive: true });
    
    console.log(`${browser.charAt(0).toUpperCase() + browser.slice(1)} extension package created: ${zipName}`);
  } catch (error) {
    console.error(`Error building ${browser} extension:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Build for Chrome
    await buildExtension('chrome');
    
    // Build for Firefox
    await buildExtension('firefox');
    
    console.log('All extension packages created successfully');
  } catch (error) {
    console.error('Error building extensions:', error);
    process.exit(1);
  }
}

main();