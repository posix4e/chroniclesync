#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SAFARI_DIR="$ROOT_DIR/safari/ChronicleSync"
DIST_DIR="$ROOT_DIR/dist"
RESOURCES_DIR="$SAFARI_DIR/ChronicleSync Extension/Resources"

# Ensure the resources directory exists
mkdir -p "$RESOURCES_DIR"

# Build the extension JavaScript files
echo "Building extension JavaScript files..."
cd "$ROOT_DIR"
npm run build

# Copy the built files to the Safari extension resources
echo "Copying files to Safari extension resources..."

# Create the resources directory if it doesn't exist
mkdir -p "$RESOURCES_DIR"

# Copy JavaScript files
cp "$ROOT_DIR/dist/background.js" "$RESOURCES_DIR/"
cp "$ROOT_DIR/dist/content-script.js" "$RESOURCES_DIR/"
cp "$ROOT_DIR/dist/popup.js" "$RESOURCES_DIR/"

# Copy HTML and CSS files
cp "$ROOT_DIR/popup.html" "$RESOURCES_DIR/"
cp "$ROOT_DIR/popup.css" "$RESOURCES_DIR/"

# Copy manifest
cp "$SAFARI_DIR/ChronicleSync Extension/Resources/manifest.json" "$RESOURCES_DIR/"

# Build the Safari extension using xcodebuild
echo "Building Safari extension..."
cd "$SAFARI_DIR"

# Check if running on macOS
if [[ "$(uname)" == "Darwin" ]]; then
  # Build the Safari extension
  xcodebuild -project ChronicleSync.xcodeproj -scheme "ChronicleSync" -configuration Release -sdk iphoneos build
  
  # Create a directory for the output
  mkdir -p "$DIST_DIR"
  
  # Copy the built app to the dist directory
  cp -R "$SAFARI_DIR/build/Release-iphoneos/ChronicleSync.app" "$DIST_DIR/ChronicleSync.app"
  
  # Create a zip file of the app
  cd "$DIST_DIR"
  zip -r safari-extension.zip ChronicleSync.app
  
  echo "Safari extension built successfully: $DIST_DIR/safari-extension.zip"
else
  echo "Safari extension can only be built on macOS. Skipping build."
  # Create a placeholder file for CI
  mkdir -p "$DIST_DIR"
  echo "This is a placeholder for the Safari extension. It can only be built on macOS." > "$DIST_DIR/safari-extension-placeholder.txt"
fi