#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/../extension"
SAFARI_EXTENSION_DIR="$SCRIPT_DIR/ChronicleSync Extension/Resources"

# Build the extension
echo "Building extension..."
cd "$EXTENSION_DIR"
npm run build

# Create Safari extension directory if it doesn't exist
mkdir -p "$SAFARI_EXTENSION_DIR"

# Copy necessary files
echo "Copying files to Safari extension..."

# Copy the manifest.json (already created with Safari-specific modifications)
# Copy HTML files
cp "$EXTENSION_DIR/popup.html" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/settings.html" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/history.html" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/devtools.html" "$SAFARI_EXTENSION_DIR/"

# Copy CSS files
cp "$EXTENSION_DIR/popup.css" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/settings.css" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/history.css" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/devtools.css" "$SAFARI_EXTENSION_DIR/"

# Copy JS files
cp "$EXTENSION_DIR/dist/popup.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/background.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/settings.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/history.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/devtools.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/devtools-page.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/dist/content-script.js" "$SAFARI_EXTENSION_DIR/"
cp "$EXTENSION_DIR/bip39-wordlist.js" "$SAFARI_EXTENSION_DIR/"

# Copy assets directory if it exists
if [ -d "$EXTENSION_DIR/dist/assets" ]; then
  mkdir -p "$SAFARI_EXTENSION_DIR/assets"
  cp -R "$EXTENSION_DIR/dist/assets/"* "$SAFARI_EXTENSION_DIR/assets/"
fi

echo "Safari extension build completed successfully!"