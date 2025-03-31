#!/bin/bash

# Build script for Safari iOS Extension
# This script copies the Chrome extension files to the Safari extension resources

set -e

# Directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CHROME_EXT_DIR="$SCRIPT_DIR/../extension"
SAFARI_EXT_DIR="$SCRIPT_DIR/ChronicleSync/ChronicleSync Extension/Resources"

# Create Resources directory if it doesn't exist
mkdir -p "$SAFARI_EXT_DIR"

# Build Chrome extension
echo "Building Chrome extension..."
cd "$CHROME_EXT_DIR"
npm install
npm run build

# Copy built files to Safari extension
echo "Copying files to Safari extension..."

# Copy manifest.json
cp "$CHROME_EXT_DIR/manifest.json" "$SAFARI_EXT_DIR/"

# Copy background script
cp "$CHROME_EXT_DIR/dist/background.js" "$SAFARI_EXT_DIR/"

# Copy content script
cp "$CHROME_EXT_DIR/dist/content-script.js" "$SAFARI_EXT_DIR/"

# Copy popup files
cp "$CHROME_EXT_DIR/popup.html" "$SAFARI_EXT_DIR/"
cp "$CHROME_EXT_DIR/dist/popup.js" "$SAFARI_EXT_DIR/"

# Copy platform adapter
mkdir -p "$SAFARI_EXT_DIR/src/platform"
cp "$CHROME_EXT_DIR/src/platform/index.ts" "$SAFARI_EXT_DIR/src/platform/"

echo "Safari extension build completed!"