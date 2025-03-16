#!/bin/bash

# This script builds the Safari extension by copying the necessary files from the Chrome/Firefox extension

# Set the source and destination directories
SOURCE_DIR="../"
DEST_DIR="Shared/Extension Files"

# Set the bundle identifier (use environment variable if available, otherwise default)
BUNDLE_ID=${APPLE_APP_ID:-"xyz.chroniclesync.app"}
echo "Using bundle identifier: $BUNDLE_ID"

# Create the destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Check if SwiftLint is installed
if command -v swiftlint &> /dev/null; then
  echo "Running SwiftLint..."
  swiftlint lint
else
  echo "SwiftLint not found. Skipping linting."
  echo "To install SwiftLint, run: brew install swiftlint"
fi

# Update Info.plist files with the correct bundle identifier
echo "Updating bundle identifiers in Info.plist files..."
for plist_file in iOS/Info.plist macOS/Info.plist "iOS Extension/Info.plist" "macOS Extension/Info.plist"; do
  if [ -f "$plist_file" ]; then
    # Use PlistBuddy if available, otherwise use sed
    if command -v /usr/libexec/PlistBuddy &> /dev/null; then
      /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID" "$plist_file"
      if [[ "$plist_file" == *"Extension"* ]]; then
        /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID.extension" "$plist_file"
      fi
    else
      # Fallback to sed
      sed -i '' "s/<key>CFBundleIdentifier<\/key>.*/<key>CFBundleIdentifier<\/key>\n\t<string>$BUNDLE_ID<\/string>/g" "$plist_file"
      if [[ "$plist_file" == *"Extension"* ]]; then
        sed -i '' "s/<key>CFBundleIdentifier<\/key>.*/<key>CFBundleIdentifier<\/key>\n\t<string>$BUNDLE_ID.extension<\/string>/g" "$plist_file"
      fi
    fi
    echo "✓ Updated $plist_file"
  fi
done

# Update export options plists
echo "Updating export options plists..."
for plist_file in exportOptions-iOS.plist exportOptions-macOS.plist; do
  if [ -f "$plist_file" ]; then
    # Update the bundle identifiers in the provisioning profiles section
    sed -i '' "s/xyz\.chroniclesync\.app/$BUNDLE_ID/g" "$plist_file"
    sed -i '' "s/xyz\.chroniclesync\.app\.extension/$BUNDLE_ID.extension/g" "$plist_file"
    echo "✓ Updated $plist_file"
  fi
done

# First, build the Chrome/Firefox extension
echo "Building Chrome/Firefox extension..."
cd "$SOURCE_DIR"
npm run build

# Copy the manifest.json file
echo "Copying manifest.json..."
cp manifest.json "$DEST_DIR/"

# Copy the HTML files
echo "Copying HTML files..."
cp popup.html "$DEST_DIR/"
cp settings.html "$DEST_DIR/"
cp history.html "$DEST_DIR/"

# Copy the CSS files
echo "Copying CSS files..."
cp popup.css "$DEST_DIR/"
cp settings.css "$DEST_DIR/"
cp history.css "$DEST_DIR/"

# Copy the JavaScript files from the dist directory
echo "Copying JavaScript files..."
cp dist/popup.js "$DEST_DIR/"
cp dist/background.js "$DEST_DIR/"
cp dist/settings.js "$DEST_DIR/"
cp dist/history.js "$DEST_DIR/"
cp dist/content-script.js "$DEST_DIR/"

# Copy any additional JavaScript files
echo "Copying additional JavaScript files..."
if [ -f "bip39-wordlist.js" ]; then
  cp bip39-wordlist.js "$DEST_DIR/"
fi

# Copy any assets
echo "Copying assets..."
if [ -d "dist/assets" ]; then
  mkdir -p "$DEST_DIR/assets"
  cp -r dist/assets/* "$DEST_DIR/assets/"
fi

# Copy any images
echo "Copying images..."
if [ -d "images" ]; then
  mkdir -p "$DEST_DIR/images"
  cp -r images/* "$DEST_DIR/images/"
fi

# Copy any icons
echo "Copying icons..."
if [ -d "icons" ]; then
  mkdir -p "$DEST_DIR/icons"
  cp -r icons/* "$DEST_DIR/icons/"
fi

# Validate the extension files
echo "Validating extension files..."
REQUIRED_FILES=("manifest.json" "background.js" "popup.js" "popup.html" "content-script.js")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$DEST_DIR/$file" ]; then
    echo "Error: $file not found in $DEST_DIR"
    exit 1
  else
    echo "✓ $file found"
  fi
done

echo "Safari extension files have been prepared successfully!"