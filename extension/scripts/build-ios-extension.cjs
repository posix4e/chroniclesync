/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join, resolve } = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const IOS_EXTENSION_DIR = join(ROOT_DIR, 'ChronicleSync', 'Shared (Extension)', 'Resources');

// Ensure the iOS extension directory exists
async function ensureDirectoryExists(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  // HTML files
  ['popup.html', 'popup.html'],
  ['settings.html', 'settings.html'],
  ['history.html', 'history.html'],
  
  // CSS files
  ['popup.css', 'popup.css'],
  ['settings.css', 'settings.css'],
  ['history.css', 'history.css'],
  
  // JavaScript files
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
  [join('dist', 'settings.js'), 'settings.js'],
  [join('dist', 'history.js'), 'history.js'],
  [join('dist', 'content-script.js'), 'content-script.js'],
  
  // Configuration files
  ['manifest.json', 'manifest.json'],
  ['config.js', 'config.js'],
  
  // Utility files
  [join('src', 'utils', 'content-extractor.ts'), join('utils', 'content-extractor.js')],
  [join('src', 'utils', 'system.ts'), join('utils', 'system.js')],
  
  // Database files
  [join('src', 'db', 'HistoryStore.ts'), join('db', 'HistoryStore.js')],
  
  // We'll handle images separately since they might be in different locations
  
  // Localization - we'll handle this separately too
];

// Process TypeScript files to JavaScript
async function processTypeScriptFile(srcPath, destPath) {
  try {
    // Read the TypeScript file
    const tsContent = await fs.promises.readFile(join(ROOT_DIR, srcPath), 'utf8');
    
    // Simple conversion from TypeScript to JavaScript
    // This is a basic conversion and might need to be enhanced for complex TypeScript features
    let jsContent = tsContent
      // Remove type annotations
      .replace(/:\s*[A-Za-z<>[\]|&]+/g, '')
      // Remove interface declarations
      .replace(/interface\s+[A-Za-z]+\s*\{[\s\S]*?\}/g, '')
      // Remove type declarations
      .replace(/type\s+[A-Za-z]+\s*=[\s\S]*?;/g, '')
      // Remove import type statements
      .replace(/import\s+type\s*.*?from\s*['"].*?['"];/g, '')
      // Convert import statements to ES module format
      .replace(/import\s*\{\s*(.*?)\s*\}\s*from\s*['"](.+?)['"]/g, 'import { $1 } from \'$2.js\'');
    
    // Ensure the directory exists
    const destDir = join(IOS_EXTENSION_DIR, destPath.substring(0, destPath.lastIndexOf('/')));
    await ensureDirectoryExists(destDir);
    
    // Write the JavaScript file
    await fs.promises.writeFile(join(IOS_EXTENSION_DIR, destPath), jsContent, 'utf8');
    console.log(`Processed: ${srcPath} -> ${destPath}`);
  } catch (error) {
    console.error(`Error processing TypeScript file ${srcPath}:`, error);
  }
}

// Handle copying image files
async function copyImageFiles() {
  const imageDir = join(IOS_EXTENSION_DIR, 'images');
  await ensureDirectoryExists(imageDir);
  
  // Define image sizes to copy
  const imageSizes = ['48', '64', '96', '128', '256', '512'];
  
  for (const size of imageSizes) {
    const iconName = `icon-${size}.png`;
    
    // Try to find the image in the public directory first
    let srcPath = join(ROOT_DIR, 'public', 'images', iconName);
    let found = false;
    
    try {
      await fs.promises.access(srcPath);
      found = true;
    } catch (error) {
      // Not found in public directory, try dist directory
      srcPath = join(ROOT_DIR, 'dist', 'images', iconName);
      try {
        await fs.promises.access(srcPath);
        found = true;
      } catch (error) {
        // Not found in dist directory either, try src directory
        srcPath = join(ROOT_DIR, 'src', 'assets', 'images', iconName);
        try {
          await fs.promises.access(srcPath);
          found = true;
        } catch (error) {
          // Not found in any expected location
          // Check if the file already exists in the iOS extension directory
          const existingPath = join(imageDir, iconName);
          try {
            await fs.promises.access(existingPath);
            console.log(`Image already exists in iOS extension: ${iconName}`);
            // Skip this file since it already exists
            continue;
          } catch (error) {
            // Not found in iOS extension either
          }
        }
      }
    }
    
    if (found) {
      const destPath = join(imageDir, iconName);
      await cp(srcPath, destPath).catch(err => {
        console.warn(`Warning: Could not copy ${srcPath}: ${err.message}`);
      });
      console.log(`Copied image: ${iconName}`);
    } else {
      console.warn(`Warning: Could not find image file: ${iconName}`);
    }
  }
  
  // Try to copy toolbar-icon.svg if it exists
  const toolbarIconName = 'toolbar-icon.svg';
  let toolbarSrcPath = join(ROOT_DIR, 'public', 'images', toolbarIconName);
  let found = false;
  
  try {
    await fs.promises.access(toolbarSrcPath);
    found = true;
  } catch (error) {
    // Try other locations
    toolbarSrcPath = join(ROOT_DIR, 'dist', 'images', toolbarIconName);
    try {
      await fs.promises.access(toolbarSrcPath);
      found = true;
    } catch (error) {
      toolbarSrcPath = join(ROOT_DIR, 'src', 'assets', 'images', toolbarIconName);
      try {
        await fs.promises.access(toolbarSrcPath);
        found = true;
      } catch (error) {
        // Check if the file already exists in the iOS extension directory
        const existingPath = join(imageDir, toolbarIconName);
        try {
          await fs.promises.access(existingPath);
          console.log(`Image already exists in iOS extension: ${toolbarIconName}`);
          return; // Skip this file since it already exists
        } catch (error) {
          // Not found in iOS extension either
        }
      }
    }
  }
  
  if (found) {
    const destPath = join(imageDir, toolbarIconName);
    await cp(toolbarSrcPath, destPath).catch(err => {
      console.warn(`Warning: Could not copy ${toolbarSrcPath}: ${err.message}`);
    });
    console.log(`Copied image: ${toolbarIconName}`);
  } else {
    console.warn(`Warning: Could not find image file: ${toolbarIconName}`);
  }
}

// Handle copying localization files
async function copyLocalizationFiles() {
  const localesDir = join(IOS_EXTENSION_DIR, '_locales', 'en');
  await ensureDirectoryExists(localesDir);
  
  // Check if the file already exists in the iOS extension directory
  const destPath = join(localesDir, 'messages.json');
  try {
    await fs.promises.access(destPath);
    console.log('Localization file already exists in iOS extension: messages.json');
    return; // Skip if the file already exists
  } catch (error) {
    // File doesn't exist, continue with copying
  }
  
  // Try to find messages.json in various locations
  let messagesPath = join(ROOT_DIR, 'public', '_locales', 'en', 'messages.json');
  let found = false;
  
  try {
    await fs.promises.access(messagesPath);
    found = true;
  } catch (error) {
    // Try other locations
    messagesPath = join(ROOT_DIR, 'dist', '_locales', 'en', 'messages.json');
    try {
      await fs.promises.access(messagesPath);
      found = true;
    } catch (error) {
      messagesPath = join(ROOT_DIR, 'src', '_locales', 'en', 'messages.json');
      try {
        await fs.promises.access(messagesPath);
        found = true;
      } catch (error) {
        // Not found
      }
    }
  }
  
  if (found) {
    await cp(messagesPath, destPath).catch(err => {
      console.warn(`Warning: Could not copy ${messagesPath}: ${err.message}`);
    });
    console.log('Copied localization file: messages.json');
  } else {
    console.warn('Warning: Could not find localization file: messages.json');
    
    // Create a basic messages.json if not found
    const basicMessages = {
      "appName": {
        "message": "ChronicleSync",
        "description": "The name of the application"
      },
      "appDescription": {
        "message": "Sync your browsing history across devices with ChronicleSync",
        "description": "The description of the application"
      }
    };
    
    await fs.promises.writeFile(destPath, JSON.stringify(basicMessages, null, 2), 'utf8');
    console.log('Created basic messages.json file');
  }
}

async function main() {
  try {
    // Create iOS extension directory if it doesn't exist
    await ensureDirectoryExists(IOS_EXTENSION_DIR);
    
    // Create subdirectories
    await ensureDirectoryExists(join(IOS_EXTENSION_DIR, 'db'));
    await ensureDirectoryExists(join(IOS_EXTENSION_DIR, 'utils'));
    await ensureDirectoryExists(join(IOS_EXTENSION_DIR, 'images'));
    await ensureDirectoryExists(join(IOS_EXTENSION_DIR, '_locales', 'en'));
    
    // Run the build for Chrome extension
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Copy necessary files
    console.log('Copying files to iOS extension directory...');
    for (const [src, dest] of filesToCopy) {
      const srcPath = join(ROOT_DIR, src);
      const destPath = join(IOS_EXTENSION_DIR, dest);
      
      // Check if the source file exists
      try {
        await fs.promises.access(srcPath);
      } catch (error) {
        console.warn(`Warning: Source file ${srcPath} does not exist. Skipping.`);
        continue;
      }
      
      // If it's a TypeScript file, process it
      if (src.endsWith('.ts')) {
        await processTypeScriptFile(src, dest);
      } else {
        // Ensure the destination directory exists
        const destDir = destPath.substring(0, destPath.lastIndexOf('/'));
        await ensureDirectoryExists(destDir);
        
        // Copy the file
        await cp(srcPath, destPath, { recursive: true }).catch(err => {
          console.warn(`Warning: Could not copy ${src}: ${err.message}`);
        });
      }
    }
    
    // Copy image files
    await copyImageFiles();
    
    // Copy localization files
    await copyLocalizationFiles();
    
    console.log('iOS extension files updated successfully!');
  } catch (error) {
    console.error('Error building iOS extension:', error);
    process.exit(1);
  }
}

main();