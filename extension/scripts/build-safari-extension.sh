#!/bin/bash
set -e

# Script to build Safari extension for both macOS and iOS
# This script should be run on a macOS runner in GitHub Actions

# Configuration
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFARI_DIR="$EXTENSION_DIR/safari"
PACKAGE_DIR="$EXTENSION_DIR/package"
SAFARI_PROJECT_DIR="$SAFARI_DIR/ChronicleSync"
SAFARI_PROJECT="$SAFARI_PROJECT_DIR/ChronicleSync.xcodeproj"
ARCHIVE_PATH="$SAFARI_DIR/build/ChronicleSync.xcarchive"
IOS_ARCHIVE_PATH="$SAFARI_DIR/build/ChronicleSync-iOS.xcarchive"
EXPORT_PATH="$SAFARI_DIR/build/export"
IOS_EXPORT_PATH="$SAFARI_DIR/build/export-ios"

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
cp "$EXTENSION_DIR/popup.html" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/popup.css" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.html" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.css" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.html" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.css" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/devtools.html" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/devtools.css" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/bip39-wordlist.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/popup.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/background.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/settings.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/history.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/devtools.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/devtools-page.js" "$RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/content-script.js" "$RESOURCES_DIR/"
cp -r "$EXTENSION_DIR/dist/assets/"* "$RESOURCES_DIR/assets/"

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

# Build for macOS
echo "Building Safari extension for macOS..."
xcodebuild -project "$SAFARI_PROJECT" -scheme "ChronicleSync" -configuration Release \
    -archivePath "$ARCHIVE_PATH" archive \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    CODE_SIGN_IDENTITY="Apple Development"

# Export macOS app
echo "Exporting macOS app..."
xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist <(cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>developer-id</string>
    <key>teamID</key>
    <string>$APPLE_TEAM_ID</string>
</dict>
</plist>
EOF
)

# Build for iOS
echo "Building Safari extension for iOS..."
xcodebuild -project "$SAFARI_PROJECT" -scheme "ChronicleSync" -configuration Release \
    -destination "generic/platform=iOS" -archivePath "$IOS_ARCHIVE_PATH" archive \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    CODE_SIGN_IDENTITY="Apple Development"

# Export iOS app
echo "Exporting iOS app..."
xcodebuild -exportArchive -archivePath "$IOS_ARCHIVE_PATH" -exportPath "$IOS_EXPORT_PATH" \
    -exportOptionsPlist <(cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>$APPLE_TEAM_ID</string>
</dict>
</plist>
EOF
)

# Create zip files for distribution
echo "Creating distribution packages..."
cd "$EXPORT_PATH"
zip -r "$EXTENSION_DIR/safari-macos-extension.zip" "ChronicleSync.app"

cd "$IOS_EXPORT_PATH"
zip -r "$EXTENSION_DIR/safari-ios-extension.zip" "ChronicleSync.ipa"

echo "Safari extension packages created: safari-macos-extension.zip and safari-ios-extension.zip"