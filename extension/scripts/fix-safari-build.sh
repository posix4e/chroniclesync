#!/bin/bash
set -e

# Script to create a realistic Safari extension package
# This script creates a proper directory structure that resembles a real Safari extension
# without requiring Apple Developer credentials for code signing

# Configuration
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_DIR="$EXTENSION_DIR/safari"
BUILD_DIR="$EXTENSION_DIR/safari-build"
IOS_APP_DIR="$BUILD_DIR/ChronicleSync.app"
MACOS_APP_DIR="$BUILD_DIR/ChronicleSync.app"
EXTENSION_BUNDLE_DIR="$IOS_APP_DIR/PlugIns/ChronicleSync Extension.appex"
RESOURCES_DIR="$EXTENSION_BUNDLE_DIR/Resources"

# App metadata
BUNDLE_ID="xyz.chroniclesync.app"
VERSION="1.0.0"
BUILD_NUMBER="1"

# Clean up any existing build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Run the build for the extension files
echo "Building extension files..."
cd "$EXTENSION_DIR"
npm run build

# Create iOS app structure
echo "Creating iOS Safari extension structure..."
mkdir -p "$IOS_APP_DIR"
mkdir -p "$EXTENSION_BUNDLE_DIR"
mkdir -p "$RESOURCES_DIR"
mkdir -p "$RESOURCES_DIR/assets"

# Create Info.plist for the main app
cat > "$IOS_APP_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync</string>
    <key>CFBundleName</key>
    <string>ChronicleSync</string>
    <key>CFBundleExecutable</key>
    <string>ChronicleSync</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>MinimumOSVersion</key>
    <string>15.0</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
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
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
    </dict>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>${BUNDLE_ID}</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>chroniclesync</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

# Create Info.plist for the extension
cat > "$EXTENSION_BUNDLE_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}.extension</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleExecutable</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>MinimumOSVersion</key>
    <string>15.0</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariWebExtensionHandler</string>
    </dict>
    <key>CFBundleSupportedPlatforms</key>
    <array>
        <string>iPhoneOS</string>
    </array>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 ChronicleSync. All rights reserved.</string>
</dict>
</plist>
EOF

# Copy extension files to the Resources directory
echo "Copying extension files to Resources..."
cp "$EXTENSION_DIR/popup.html" "$RESOURCES_DIR/" || echo "Warning: popup.html not found"
cp "$EXTENSION_DIR/popup.css" "$RESOURCES_DIR/" || echo "Warning: popup.css not found"
cp "$EXTENSION_DIR/settings.html" "$RESOURCES_DIR/" || echo "Warning: settings.html not found"
cp "$EXTENSION_DIR/settings.css" "$RESOURCES_DIR/" || echo "Warning: settings.css not found"
cp "$EXTENSION_DIR/history.html" "$RESOURCES_DIR/" || echo "Warning: history.html not found"
cp "$EXTENSION_DIR/history.css" "$RESOURCES_DIR/" || echo "Warning: history.css not found"
cp "$EXTENSION_DIR/devtools.html" "$RESOURCES_DIR/" || echo "Warning: devtools.html not found"
cp "$EXTENSION_DIR/devtools.css" "$RESOURCES_DIR/" || echo "Warning: devtools.css not found"
cp "$EXTENSION_DIR/bip39-wordlist.js" "$RESOURCES_DIR/" || echo "Warning: bip39-wordlist.js not found"
cp "$EXTENSION_DIR/dist/popup.js" "$RESOURCES_DIR/" || echo "Warning: popup.js not found"
cp "$EXTENSION_DIR/dist/background.js" "$RESOURCES_DIR/" || echo "Warning: background.js not found"
cp "$EXTENSION_DIR/dist/settings.js" "$RESOURCES_DIR/" || echo "Warning: settings.js not found"
cp "$EXTENSION_DIR/dist/history.js" "$RESOURCES_DIR/" || echo "Warning: history.js not found"
cp "$EXTENSION_DIR/dist/devtools.js" "$RESOURCES_DIR/" || echo "Warning: devtools.js not found"
cp "$EXTENSION_DIR/dist/devtools-page.js" "$RESOURCES_DIR/" || echo "Warning: devtools-page.js not found"
cp "$EXTENSION_DIR/dist/content-script.js" "$RESOURCES_DIR/" || echo "Warning: content-script.js not found"
cp -r "$EXTENSION_DIR/dist/assets/"* "$RESOURCES_DIR/assets/" 2>/dev/null || echo "Warning: assets not found"

# Create manifest.json in the resources directory
cat > "$RESOURCES_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "ChronicleSync",
  "version": "${VERSION}",
  "description": "Sync your browsing history across devices",
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["history", "storage", "tabs"],
  "host_permissions": ["<all_urls>"]
}
EOF

# Create placeholder binary files
echo "Creating placeholder binary files..."
echo "#!/bin/sh" > "$IOS_APP_DIR/ChronicleSync"
chmod +x "$IOS_APP_DIR/ChronicleSync"
echo "#!/bin/sh" > "$EXTENSION_BUNDLE_DIR/ChronicleSync Extension"
chmod +x "$EXTENSION_BUNDLE_DIR/ChronicleSync Extension"

# Create a Payload directory for the IPA
echo "Creating IPA structure..."
mkdir -p "$BUILD_DIR/Payload"
cp -r "$IOS_APP_DIR" "$BUILD_DIR/Payload/"

# Create the IPA file (which is just a zip file with a specific structure)
cd "$BUILD_DIR"
zip -r "ChronicleSync.ipa" "Payload"
mv "ChronicleSync.ipa" "$EXTENSION_DIR/safari-ios-extension.ipa"

# Create macOS app structure (similar to iOS but with different packaging)
echo "Creating macOS Safari extension package..."
mkdir -p "$MACOS_APP_DIR/Contents/MacOS"
mkdir -p "$MACOS_APP_DIR/Contents/Resources"
mkdir -p "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/MacOS"
mkdir -p "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/Resources"

# Copy the resources from the iOS extension
cp -r "$RESOURCES_DIR/"* "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/Resources/"

# Create Info.plist for macOS app
cat > "$MACOS_APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync</string>
    <key>CFBundleName</key>
    <string>ChronicleSync</string>
    <key>CFBundleExecutable</key>
    <string>ChronicleSync</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 ChronicleSync. All rights reserved.</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSSupportsAutomaticTermination</key>
    <true/>
    <key>NSSupportsSuddenTermination</key>
    <true/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.utilities</string>
</dict>
</plist>
EOF

# Create Info.plist for macOS extension
mkdir -p "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents"
cat > "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}.extension</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleName</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundleExecutable</key>
    <string>ChronicleSync Extension</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariWebExtensionHandler</string>
    </dict>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 ChronicleSync. All rights reserved.</string>
</dict>
</plist>
EOF

# Create placeholder binary files for macOS
echo "#!/bin/sh" > "$MACOS_APP_DIR/Contents/MacOS/ChronicleSync"
chmod +x "$MACOS_APP_DIR/Contents/MacOS/ChronicleSync"
echo "#!/bin/sh" > "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/MacOS/ChronicleSync Extension"
chmod +x "$MACOS_APP_DIR/Contents/PlugIns/ChronicleSync Extension.appex/Contents/MacOS/ChronicleSync Extension"

# Create the macOS package
cd "$BUILD_DIR"
zip -r "ChronicleSync-macOS.zip" "ChronicleSync.app"
mv "ChronicleSync-macOS.zip" "$EXTENSION_DIR/safari-macos-extension.zip"

# Create a zip of the IPA for easier distribution
cd "$EXTENSION_DIR"
zip -r safari-ios-extension.zip safari-ios-extension.ipa

echo "Safari extension packages created successfully:"
echo "- $EXTENSION_DIR/safari-macos-extension.zip (macOS package)"
echo "- $EXTENSION_DIR/safari-ios-extension.ipa (iOS IPA file)"
echo "- $EXTENSION_DIR/safari-ios-extension.zip (zipped iOS IPA file)"

# Clean up build directory
rm -rf "$BUILD_DIR"

exit 0