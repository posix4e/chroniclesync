#!/bin/bash
set -e

# Directory setup
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SAFARI_DIR="$ROOT_DIR/safari"
PACKAGE_DIR="$ROOT_DIR/package"
DIST_DIR="$ROOT_DIR/dist"
SAFARI_PROJECT_DIR="$SAFARI_DIR/ChronicleSync"
SAFARI_EXTENSION_DIR="$SAFARI_PROJECT_DIR/ChronicleSync Extension"
SAFARI_RESOURCES_DIR="$SAFARI_EXTENSION_DIR/Resources"

# Ensure the package directory exists
mkdir -p "$PACKAGE_DIR"

# Build the extension
echo "Building extension..."
cd "$ROOT_DIR" && npm run build

# Create Safari extension structure
echo "Creating Safari extension structure..."
mkdir -p "$SAFARI_RESOURCES_DIR"

# Copy extension files to Safari resources
echo "Copying extension files to Safari resources..."
cp -R "$DIST_DIR"/* "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/manifest.json" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/popup.html" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/popup.css" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/settings.html" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/settings.css" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/history.html" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/history.css" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/devtools.html" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/devtools.css" "$SAFARI_RESOURCES_DIR/"
cp "$ROOT_DIR/bip39-wordlist.js" "$SAFARI_RESOURCES_DIR/"

# Convert manifest.json to Safari format
echo "Converting manifest.json to Safari format..."
node "$SCRIPT_DIR/convert-manifest-to-safari.js" --experimental-modules

# Build the Xcode project
echo "Building Xcode project..."
cd "$SAFARI_PROJECT_DIR"

# Set up certificates and provisioning profiles
echo "Setting up certificates and provisioning profiles..."
# This will be handled in the GitHub Action

# Build the project
echo "Building the project..."
xcodebuild -project ChronicleSync.xcodeproj \
  -scheme "ChronicleSync (iOS)" \
  -configuration Release \
  -sdk iphoneos \
  -archivePath "$SAFARI_DIR/ChronicleSync.xcarchive" \
  archive

# Export the IPA
echo "Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "$SAFARI_DIR/ChronicleSync.xcarchive" \
  -exportOptionsPlist "$SAFARI_DIR/ExportOptions.plist" \
  -exportPath "$SAFARI_DIR"

echo "Safari extension IPA created at $SAFARI_DIR/ChronicleSync.ipa"