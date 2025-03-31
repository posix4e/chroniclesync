#!/usr/bin/env node

const { readdir, readFile, writeFile } = require('fs/promises');
const { join } = require('path');

const SAFARI_DIR = join(__dirname, 'ChronicleSync');

// The adapter script to be injected at the beginning of each JS file
const ADAPTER_IMPORT = `
// Safari API adapter import
if (typeof window !== 'undefined') {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('safari-api-adapter.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = function() {
    script.remove();
  };
}

// Use browserAPI instead of chrome
const chrome = window.browserAPI || chrome;
`;

async function modifyJSFiles() {
  try {
    // Get all JS files in the Safari extension directory
    const files = await readdir(SAFARI_DIR);
    const jsFiles = files.filter(file => file.endsWith('.js') && file !== 'safari-api-adapter.js');
    
    for (const file of jsFiles) {
      const filePath = join(SAFARI_DIR, file);
      let content = await readFile(filePath, 'utf8');
      
      // Skip if the file already has the adapter import
      if (content.includes('safari-api-adapter.js')) {
        console.log(`Skipping ${file} - already modified`);
        continue;
      }
      
      // Add the adapter import at the beginning of the file
      content = ADAPTER_IMPORT + content;
      
      // Replace direct chrome API calls with browserAPI
      // This is a simple replacement and might need more sophisticated handling
      // content = content.replace(/chrome\./g, 'browserAPI.');
      
      // Write the modified content back to the file
      await writeFile(filePath, content, 'utf8');
      console.log(`Modified ${file}`);
    }
    
    console.log('All JS files have been modified to use the Safari API adapter');
  } catch (error) {
    console.error('Error modifying JS files:', error);
  }
}

modifyJSFiles();