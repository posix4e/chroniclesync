const fs = require('fs');
const path = require('path');

// Paths
const distDir = path.join(__dirname, '../dist');
const iosResourcesDir = path.join(__dirname, '../../ChronicleSync-iOS/ChronicleSync-iOS/Extension/Resources');

// Ensure iOS resources directory exists
if (!fs.existsSync(iosResourcesDir)) {
  fs.mkdirSync(iosResourcesDir, { recursive: true });
}

// Copy shared code to iOS resources
function copySharedCode() {
  console.log('Copying shared code to iOS resources...');
  
  // Read all files from dist directory
  const files = fs.readdirSync(distDir);
  
  // Copy each JavaScript file
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const sourcePath = path.join(distDir, file);
      const destPath = path.join(iosResourcesDir, file);
      
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to iOS resources`);
    }
  });
  
  console.log('Shared code copied to iOS resources');
}

// Create an index.js file that exports all shared code
function createIndexFile() {
  console.log('Creating index.js for iOS...');
  
  const indexPath = path.join(iosResourcesDir, 'shared-index.js');
  const files = fs.readdirSync(distDir);
  
  let indexContent = '// Generated index file for shared code\n\n';
  
  files.forEach(file => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const moduleName = file.replace('.js', '');
      indexContent += `import * as ${moduleName} from './${file}';\n`;
    }
  });
  
  indexContent += '\n// Export all modules\n';
  indexContent += 'window.ChronicleSync = {\n';
  
  files.forEach(file => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const moduleName = file.replace('.js', '');
      indexContent += `  ${moduleName},\n`;
    }
  });
  
  indexContent += '};\n';
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created index.js for iOS');
}

// Main function
function main() {
  copySharedCode();
  createIndexFile();
  console.log('iOS preparation complete');
}

main();