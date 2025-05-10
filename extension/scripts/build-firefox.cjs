const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the Firefox extension
console.log('Building Firefox extension...');
execSync('npm run build:firefox', { stdio: 'inherit' });

// Copy the Firefox manifest to the dist-firefox directory
console.log('Copying Firefox manifest...');
fs.copyFileSync(
  path.join(__dirname, '..', 'manifest.firefox.json'),
  path.join(__dirname, '..', 'dist-firefox', 'manifest.json')
);

// Copy the background.html file to the dist-firefox directory
console.log('Copying background.html...');
fs.copyFileSync(
  path.join(__dirname, '..', 'background.html'),
  path.join(__dirname, '..', 'dist-firefox', 'background.html')
);

console.log('Firefox extension build complete!');