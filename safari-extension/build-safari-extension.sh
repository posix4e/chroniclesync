#!/bin/bash

# Exit on error
set -e

# Define paths
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/extension"
SAFARI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAFARI_RESOURCES_DIR="$SAFARI_DIR/ChronicleSync Extension/Resources"

# Build the Chrome extension first
echo "Building Chrome extension..."
cd "$EXTENSION_DIR"
npm ci
npm run build

# Create Safari extension resources directory if it doesn't exist
mkdir -p "$SAFARI_RESOURCES_DIR"

# Copy extension files to Safari extension
echo "Copying extension files to Safari extension..."
cp "$EXTENSION_DIR/popup.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/popup.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/devtools.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/devtools.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/bip39-wordlist.js" "$SAFARI_RESOURCES_DIR/"

# Copy built JS files
cp "$EXTENSION_DIR/dist/popup.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/background.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/settings.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/history.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/devtools.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/devtools-page.js" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/dist/content-script.js" "$SAFARI_RESOURCES_DIR/"

# Copy assets directory if it exists
if [ -d "$EXTENSION_DIR/dist/assets" ]; then
  mkdir -p "$SAFARI_RESOURCES_DIR/assets"
  cp -R "$EXTENSION_DIR/dist/assets/"* "$SAFARI_RESOURCES_DIR/assets/"
fi

echo "Safari extension resources prepared successfully!"

# Build the Xcode project (requires xcodebuild)
if command -v xcodebuild &> /dev/null; then
  echo "Building Safari extension with xcodebuild..."
  cd "$SAFARI_DIR"
  
  # Check if APPLE_TEAM_ID and APPLE_APP_ID are set
  if [ -z "${APPLE_TEAM_ID}" ] || [ -z "${APPLE_APP_ID}" ]; then
    echo "Warning: APPLE_TEAM_ID or APPLE_APP_ID environment variables are not set."
    echo "You can set them by running:"
    echo "export APPLE_TEAM_ID=your_team_id"
    echo "export APPLE_APP_ID=your.app.bundle.id"
    echo "Attempting to build without these variables may fail."
  fi
  
  # Build with allowProvisioningUpdates flag to enable automatic provisioning
  xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Release -sdk iphoneos -archivePath "build/ChronicleSync.xcarchive" archive DEVELOPMENT_TEAM="${APPLE_TEAM_ID}" PRODUCT_BUNDLE_IDENTIFIER="${APPLE_APP_ID}" -allowProvisioningUpdates
  
  # Export the archive as IPA
  xcodebuild -exportArchive -archivePath "build/ChronicleSync.xcarchive" -exportOptionsPlist exportOptions.plist -exportPath "build" DEVELOPMENT_TEAM="${APPLE_TEAM_ID}" PRODUCT_BUNDLE_IDENTIFIER="${APPLE_APP_ID}" -allowProvisioningUpdates
  
  echo "IPA file created at $SAFARI_DIR/build/ChronicleSync.ipa"
else
  echo "xcodebuild not found. Skipping IPA creation."
  echo "To build the IPA file, run this script on a macOS system with Xcode installed."
fi