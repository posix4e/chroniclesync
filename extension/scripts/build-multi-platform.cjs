/* eslint-disable no-console */
const { mkdir, rm, cp, readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
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

/**
 * Supported browser platforms
 * @type {Object.<string, {manifestFile: string, outputName: string, packageDir: string}>}
 */
const PLATFORMS = {
  chrome: {
    manifestFile: 'manifest.json',
    outputName: 'chrome-extension.zip',
    packageDir: join(PACKAGE_DIR, 'chrome')
  },
  firefox: {
    manifestFile: 'manifest.firefox.json',
    outputName: 'firefox-extension.zip',
    packageDir: join(PACKAGE_DIR, 'firefox')
  },
  safari: {
    manifestFile: 'manifest.safari.json',
    outputName: 'safari-extension.zip',
    packageDir: join(PACKAGE_DIR, 'safari')
  }
};

/**
 * Build extension for a specific platform
 * @param {string} platform - Platform name (chrome, firefox, safari)
 */
async function buildForPlatform(platform) {
  if (!PLATFORMS[platform]) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const { manifestFile, outputName, packageDir } = PLATFORMS[platform];
  console.log(`Building for ${platform}...`);

  try {
    // Create platform-specific package directory
    await mkdir(packageDir, { recursive: true });
    
    // Copy manifest file with the correct name
    await cp(
      join(ROOT_DIR, manifestFile),
      join(packageDir, 'manifest.json')
    );
    
    // Copy necessary files
    console.log(`Copying files for ${platform}...`);
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(packageDir, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Create zip file
    console.log(`Creating zip file for ${platform}...`);
    await execAsync(`cd "${packageDir}" && zip -r ../../${outputName} ./*`);
    
    console.log(`${platform} package created: ${outputName}`);
  } catch (error) {
    console.error(`Error building for ${platform}:`, error);
    throw error;
  }
}

/**
 * Create Xcode project for Safari iOS extension
 */
async function createSafariIOSProject() {
  console.log('Creating Safari iOS project...');
  
  try {
    const SAFARI_IOS_DIR = join(ROOT_DIR, 'safari-ios');
    
    // Create Safari iOS directory
    await mkdir(SAFARI_IOS_DIR, { recursive: true });
    
    // Copy necessary files for Safari iOS
    await cp(
      join(PACKAGE_DIR, 'safari'),
      join(SAFARI_IOS_DIR, 'extension'),
      { recursive: true }
    );
    
    // Create Info.plist file
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;
    
    await writeFile(join(SAFARI_IOS_DIR, 'Info.plist'), infoPlistContent);
    
    // Create README with instructions
    const readmeContent = `# ChronicleSync Safari iOS Extension

## Setup Instructions

1. Open Xcode and create a new project
2. Select "Safari Extension App" template
3. Name the project "ChronicleSync"
4. Replace the extension files with the contents of the 'extension' directory
5. Update the Info.plist file with the provided one
6. Build and run the project

## Development

For development and testing on iOS devices, you'll need to:

1. Have a valid Apple Developer account
2. Configure the app with your development team
3. Enable Safari Web Extension development in Safari settings on your iOS device
4. Build and deploy to your device through Xcode

## Distribution

To distribute the extension:

1. Archive the project in Xcode
2. Upload to App Store Connect
3. Submit for review

For more details, see Apple's documentation on Safari Web Extensions:
https://developer.apple.com/documentation/safariservices/safari_web_extensions
`;
    
    await writeFile(join(SAFARI_IOS_DIR, 'README.md'), readmeContent);
    
    console.log('Safari iOS project created successfully');
  } catch (error) {
    console.error('Error creating Safari iOS project:', error);
  }
}

/**
 * Main build function
 * @param {string[]} platforms - Platforms to build for
 */
async function main(platforms = ['chrome', 'firefox', 'safari']) {
  try {
    // Validate platforms
    const validPlatforms = Object.keys(PLATFORMS);
    platforms = platforms.filter(p => validPlatforms.includes(p));
    
    if (platforms.length === 0) {
      console.error(`No valid platforms specified. Valid options: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }
    
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Build for each platform
    for (const platform of platforms) {
      await buildForPlatform(platform);
    }
    
    // Create Safari iOS project if Safari is included
    if (platforms.includes('safari')) {
      await createSafariIOSProject();
    }
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('All extension packages created successfully!');
  } catch (error) {
    console.error('Error building extensions:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const platforms = args.length > 0 ? args : ['chrome', 'firefox', 'safari'];

main(platforms);