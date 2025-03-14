/* eslint-disable no-console */
const { mkdir, rm, cp, writeFile, readFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');
const SAFARI_DIR = join(ROOT_DIR, 'safari-app');
const SAFARI_EXTENSION_DIR = join(SAFARI_DIR, 'ChronicleSync Extension');
const SAFARI_APP_DIR = join(SAFARI_DIR, 'ChronicleSync');

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

// Safari App Extension template files
const INFO_PLIST_EXTENSION = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>com.chroniclesync.extension</string>
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

const INFO_PLIST_APP = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIconFile</key>
    <string></string>
    <key>CFBundleIdentifier</key>
    <string>com.chroniclesync.app</string>
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
    <key>NSMainStoryboardFile</key>
    <string>Main</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>`;

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-only</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>`;

const SAFARI_WEB_EXTENSION_HANDLER = `import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        let response = NSExtensionItem()
        
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message from Safari Extension" ] ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}`;

const APP_DELEGATE_SWIFT = `import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create the window and set the content view
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 300),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window?.center()
        window?.title = "ChronicleSync"
        
        let contentView = NSHostingView(rootView: ContentView())
        window?.contentView = contentView
        window?.makeKeyAndOrderFront(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}`;

const CONTENT_VIEW_SWIFT = `import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var extensionEnabled = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("ChronicleSync Safari Extension")
                .font(.title)
                .padding()
            
            Button("Open Safari Extension Preferences") {
                SFSafariApplication.showPreferencesForExtension(
                    withIdentifier: "com.chroniclesync.extension") { error in
                    if let error = error {
                        print("Error showing extension preferences: \(error)")
                    }
                }
            }
            .padding()
            
            Text("Please enable the ChronicleSync extension in Safari preferences to use it.")
                .multilineTextAlignment(.center)
                .padding()
        }
        .frame(width: 400, height: 300)
        .onAppear {
            SFSafariExtensionManager.getStateOfSafariExtension(
                withIdentifier: "com.chroniclesync.extension") { state, error in
                if let state = state {
                    extensionEnabled = state.isEnabled
                }
            }
        }
    }
}`;

const XCODEPROJ_TEMPLATE = `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 50;
    objects = {
        // Project structure will be generated by Xcode
    };
    rootObject = PLACEHOLDER_PROJECT_REFERENCE;
}`;

async function main() {
  try {
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    await rm(SAFARI_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    await mkdir(SAFARI_DIR, { recursive: true });
    await mkdir(SAFARI_EXTENSION_DIR, { recursive: true });
    await mkdir(SAFARI_APP_DIR, { recursive: true });
    await mkdir(join(SAFARI_EXTENSION_DIR, 'Resources'), { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Copy necessary files to package directory
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
    
    // Read the manifest
    const manifestPath = join(PACKAGE_DIR, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    
    // Ensure Safari-specific settings are included
    if (!manifest.browser_specific_settings || !manifest.browser_specific_settings.safari) {
      manifest.browser_specific_settings = {
        ...manifest.browser_specific_settings,
        safari: {
          strict_min_version: "16.0",
          strict_max_version: "17.*"
        }
      };
      
      // Write the updated manifest
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    }
    
    // Copy extension files to Safari extension resources directory
    await cp(
      PACKAGE_DIR,
      join(SAFARI_EXTENSION_DIR, 'Resources'),
      { recursive: true }
    );
    
    // Create Safari extension files
    await writeFile(join(SAFARI_EXTENSION_DIR, 'Info.plist'), INFO_PLIST_EXTENSION);
    await writeFile(join(SAFARI_EXTENSION_DIR, 'ChronicleSync Extension.entitlements'), ENTITLEMENTS);
    await writeFile(join(SAFARI_EXTENSION_DIR, 'SafariWebExtensionHandler.swift'), SAFARI_WEB_EXTENSION_HANDLER);
    
    // Create Safari app files
    await writeFile(join(SAFARI_APP_DIR, 'Info.plist'), INFO_PLIST_APP);
    await writeFile(join(SAFARI_APP_DIR, 'ChronicleSync.entitlements'), ENTITLEMENTS);
    await writeFile(join(SAFARI_APP_DIR, 'AppDelegate.swift'), APP_DELEGATE_SWIFT);
    await writeFile(join(SAFARI_APP_DIR, 'ContentView.swift'), CONTENT_VIEW_SWIFT);
    
    // Create Xcode project template
    await writeFile(join(SAFARI_DIR, 'ChronicleSync.xcodeproj', 'project.pbxproj'), XCODEPROJ_TEMPLATE);
    
    console.log('Safari extension files created in:', SAFARI_DIR);
    console.log('To complete the setup:');
    console.log('1. Open the project in Xcode');
    console.log('2. Configure the project settings and signing');
    console.log('3. Build and run the app to install the extension');
    
  } catch (error) {
    console.error('Error building Safari extension:', error);
    process.exit(1);
  }
}

main();