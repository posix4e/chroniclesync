/* eslint-disable no-console */
const { mkdir, rm, cp, writeFile, readFile } = require('fs/promises');
const { existsSync } = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const SAFARI_DIR = join(ROOT_DIR, 'safari-ios');
const SAFARI_APP_DIR = join(SAFARI_DIR, 'ChronicleSync');
const SAFARI_EXT_DIR = join(SAFARI_APP_DIR, 'Extension');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', join(SAFARI_DIR, 'manifest.json')],
  ['popup.html', join(SAFARI_EXT_DIR, 'Resources', 'popup.html')],
  ['popup.css', join(SAFARI_EXT_DIR, 'Resources', 'popup.css')],
  ['settings.html', join(SAFARI_EXT_DIR, 'Resources', 'settings.html')],
  ['settings.css', join(SAFARI_EXT_DIR, 'Resources', 'settings.css')],
  ['history.html', join(SAFARI_EXT_DIR, 'Resources', 'history.html')],
  ['history.css', join(SAFARI_EXT_DIR, 'Resources', 'history.css')],
  ['devtools.html', join(SAFARI_EXT_DIR, 'Resources', 'devtools.html')],
  ['devtools.css', join(SAFARI_EXT_DIR, 'Resources', 'devtools.css')],
  ['bip39-wordlist.js', join(SAFARI_EXT_DIR, 'Resources', 'bip39-wordlist.js')],
  [join('dist', 'popup.js'), join(SAFARI_EXT_DIR, 'Resources', 'popup.js')],
  [join('dist', 'background.js'), join(SAFARI_EXT_DIR, 'Resources', 'background.js')],
  [join('dist', 'settings.js'), join(SAFARI_EXT_DIR, 'Resources', 'settings.js')],
  [join('dist', 'history.js'), join(SAFARI_EXT_DIR, 'Resources', 'history.js')],
  [join('dist', 'devtools.js'), join(SAFARI_EXT_DIR, 'Resources', 'devtools.js')],
  [join('dist', 'devtools-page.js'), join(SAFARI_EXT_DIR, 'Resources', 'devtools-page.js')],
  [join('dist', 'content-script.js'), join(SAFARI_EXT_DIR, 'Resources', 'content-script.js')],
  [join('dist', 'assets'), join(SAFARI_EXT_DIR, 'Resources', 'assets')]
];

async function createXcodeProject() {
  // Create Xcode project structure
  await mkdir(join(SAFARI_DIR), { recursive: true });
  await mkdir(join(SAFARI_APP_DIR), { recursive: true });
  await mkdir(join(SAFARI_EXT_DIR), { recursive: true });
  await mkdir(join(SAFARI_EXT_DIR, 'Resources'), { recursive: true });
  
  // Create Info.plist for the main app
  const appInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
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
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
        <key>UISceneConfigurations</key>
        <dict>
            <key>UIWindowSceneSessionRoleApplication</key>
            <array>
                <dict>
                    <key>UISceneConfigurationName</key>
                    <string>Default Configuration</string>
                    <key>UISceneDelegateClassName</key>
                    <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                    <key>UISceneStoryboardFile</key>
                    <string>Main</string>
                </dict>
            </array>
        </dict>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIMainStoryboardFile</key>
    <string>Main</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>`;

  // Create Info.plist for the extension
  const extInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
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
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;

  // Create project.pbxproj
  const projectFile = `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 50;
    objects = {
        /* Begin PBXBuildFile section */
        /* End PBXBuildFile section */
        /* Begin PBXFileReference section */
        /* End PBXFileReference section */
        /* Begin PBXGroup section */
        /* End PBXGroup section */
        /* Begin PBXNativeTarget section */
        /* End PBXNativeTarget section */
        /* Begin PBXProject section */
            BuildConfigurationList = 1DEB922208733DC00010E9CD /* Build configuration list for PBXProject "ChronicleSync" */;
            compatibilityVersion = "Xcode 9.3";
            developmentRegion = en;
            hasScannedForEncodings = 0;
            knownRegions = (
                en,
                Base,
            );
            mainGroup = 089C166AFE841209C02AAC07 /* ChronicleSync */;
            projectDirPath = "";
            projectRoot = "";
            targets = (
            );
        /* End PBXProject section */
        /* Begin XCBuildConfiguration section */
        /* End XCBuildConfiguration section */
        /* Begin XCConfigurationList section */
        /* End XCConfigurationList section */
    };
    rootObject = 089C1669FE841209C02AAC07 /* Project object */;
}`;

  // Create entitlements file
  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.chroniclesync</string>
    </array>
</dict>
</plist>`;

  // Write files
  await writeFile(join(SAFARI_APP_DIR, 'Info.plist'), appInfoPlist);
  await writeFile(join(SAFARI_EXT_DIR, 'Info.plist'), extInfoPlist);
  await mkdir(join(SAFARI_DIR, 'ChronicleSync.xcodeproj'), { recursive: true });
  await writeFile(join(SAFARI_DIR, 'ChronicleSync.xcodeproj', 'project.pbxproj'), projectFile);
  await writeFile(join(SAFARI_APP_DIR, 'ChronicleSync.entitlements'), entitlements);
  await writeFile(join(SAFARI_EXT_DIR, 'ChronicleSync Extension.entitlements'), entitlements);
}

async function convertManifestToSafariWebExtensionManifest() {
  const manifestPath = join(ROOT_DIR, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  
  // Add Safari specific settings
  manifest.browser_specific_settings = {
    "safari": {
      "strict_min_version": "14.0"
    }
  };
  
  // Write the updated manifest
  await writeFile(join(SAFARI_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

async function main() {
  try {
    // Clean up any existing Safari directory
    await rm(SAFARI_DIR, { recursive: true, force: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Create Xcode project structure
    console.log('Creating Xcode project structure...');
    await createXcodeProject();
    
    // Convert manifest.json for Safari
    console.log('Converting manifest for Safari...');
    await convertManifestToSafariWebExtensionManifest();
    
    // Copy necessary files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        dest,
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Build the Safari extension using xcodebuild
    console.log('Building Safari iOS extension...');
    if (process.env.CI) {
      // In CI environment, use the Apple certificates and provisioning profiles
      await execAsync(`
        cd "${SAFARI_DIR}" && \
        xcodebuild -project ChronicleSync.xcodeproj \
        -scheme "ChronicleSync" \
        -configuration Release \
        -sdk iphoneos \
        -archivePath "ChronicleSync.xcarchive" \
        archive
      `);
      
      // Export IPA
      await execAsync(`
        cd "${SAFARI_DIR}" && \
        xcodebuild -exportArchive \
        -archivePath "ChronicleSync.xcarchive" \
        -exportOptionsPlist exportOptions.plist \
        -exportPath .
      `);
      
      console.log('Safari iOS extension IPA created successfully');
    } else {
      console.log('Not in CI environment, skipping xcodebuild steps');
      console.log('Safari iOS extension project created at:', SAFARI_DIR);
    }
  } catch (error) {
    console.error('Error building Safari iOS extension:', error);
    process.exit(1);
  }
}

main();