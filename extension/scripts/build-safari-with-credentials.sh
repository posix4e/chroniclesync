#!/bin/bash
set -e

# Script to build Safari extension for iOS with proper credentials
# This script uses the Apple Developer credentials from environment variables

# Configuration
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_DIR="$EXTENSION_DIR/safari"
PACKAGE_DIR="$EXTENSION_DIR/package"
SAFARI_PROJECT_DIR="$SAFARI_DIR/ChronicleSync"
SAFARI_PROJECT="$SAFARI_PROJECT_DIR/ChronicleSync.xcodeproj"
ARCHIVE_PATH="$SAFARI_DIR/build/ChronicleSync-iOS.xcarchive"
EXPORT_PATH="$SAFARI_DIR/build/export-ios"

# Default bundle identifier
BUNDLE_ID=${APPLE_APP_ID:-"xyz.chroniclesync.app"}
EXTENSION_BUNDLE_ID="$BUNDLE_ID.extension"

# Ensure build directory exists
mkdir -p "$SAFARI_DIR/build"

# Clean up any existing package directory
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Run the build for the extension files
echo "Building extension files..."
cd "$EXTENSION_DIR"
npm run build

# Copy necessary files to the Safari extension resources directory
echo "Copying files to Safari extension resources..."
RESOURCES_DIR="$SAFARI_PROJECT_DIR/ChronicleSync Extension/Resources"
mkdir -p "$RESOURCES_DIR/assets"

# Copy files from the existing extension
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

# Create manifest.json if it doesn't exist in the resources directory
if [ ! -f "$RESOURCES_DIR/manifest.json" ]; then
    echo "Creating manifest.json..."
    cat > "$RESOURCES_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "ChronicleSync",
  "version": "1.0",
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
fi

# Setup code signing if certificates are available
if [ -n "$APPLE_CERTIFICATE_CONTENT" ] && [ -n "$APPLE_CERTIFICATE_PASSWORD" ]; then
    echo "Setting up code signing..."
    
    # Create a temporary keychain
    KEYCHAIN_PATH="$HOME/Library/Keychains/build.keychain"
    KEYCHAIN_PASSWORD="temporary"
    
    # Create and unlock the keychain
    security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
    
    # Import the certificate to the keychain
    echo "$APPLE_CERTIFICATE_CONTENT" | base64 --decode > /tmp/certificate.p12
    security import /tmp/certificate.p12 -k "$KEYCHAIN_PATH" -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
    
    # Add the keychain to the search list
    security list-keychains -d user -s "$KEYCHAIN_PATH" $(security list-keychains -d user | sed s/\"//g)
    
    # Set the partition list
    security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    
    # Clean up
    rm /tmp/certificate.p12
    
    # Set up provisioning profile if available
    if [ -n "$APPLE_PROVISIONING_PROFILE" ]; then
        echo "Setting up provisioning profile..."
        mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
        echo "$APPLE_PROVISIONING_PROFILE" | base64 --decode > "$HOME/Library/MobileDevice/Provisioning Profiles/profile.mobileprovision"
    fi
fi

# Build for iOS
echo "Building Safari extension for iOS..."
xcodebuild -project "$SAFARI_PROJECT" -scheme "ChronicleSync" -configuration Release \
    -destination "generic/platform=iOS" -archivePath "$ARCHIVE_PATH" archive \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    CODE_SIGN_IDENTITY="Apple Development"

# Export iOS app
echo "Exporting iOS app..."
xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist <(cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>$APPLE_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
</dict>
</plist>
EOF
)

# Verify the IPA was created
if [ -f "$EXPORT_PATH/ChronicleSync.ipa" ]; then
    echo "IPA file created successfully at $EXPORT_PATH/ChronicleSync.ipa"
    
    # Create a proper zip file for distribution
    cp "$EXPORT_PATH/ChronicleSync.ipa" "$EXTENSION_DIR/safari-ios-extension.ipa"
    cd "$EXTENSION_DIR"
    rm -f safari-ios-extension.zip
    zip -r safari-ios-extension.zip safari-ios-extension.ipa
    
    echo "Safari extension package created: $EXTENSION_DIR/safari-ios-extension.zip"
    echo "Direct IPA file available at: $EXTENSION_DIR/safari-ios-extension.ipa"
else
    echo "Error: IPA file was not created. Check the build logs for errors."
    exit 1
fi

# Create a simple script to install the app on the simulator
cat > "$EXTENSION_DIR/install-on-simulator.sh" << EOF
#!/bin/bash
# Script to install the ChronicleSync app on an iOS Simulator

# List available simulators
echo "Available simulators:"
xcrun simctl list devices | grep -v "unavailable"
echo ""
echo "To boot a simulator, run: xcrun simctl boot [DEVICE_ID]"
echo "To install the app, run: xcrun simctl install booted $EXTENSION_DIR/safari-ios-extension.ipa"
echo "To launch the app, run: xcrun simctl launch booted $BUNDLE_ID"
echo "To open Safari, run: xcrun simctl launch booted com.apple.mobilesafari"
EOF

chmod +x "$EXTENSION_DIR/install-on-simulator.sh"
echo "Created installation helper script: $EXTENSION_DIR/install-on-simulator.sh"