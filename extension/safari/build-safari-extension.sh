#!/bin/bash

# This script builds the Safari extension by copying the necessary files from the Chrome/Firefox extension

# Set the source and destination directories
SOURCE_DIR="../"
DEST_DIR="Shared/Extension Files"

# Create the destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# First, build the Chrome/Firefox extension
echo "Building Chrome/Firefox extension..."
cd "$SOURCE_DIR"
npm run build

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
cp bip39-wordlist.js "$DEST_DIR/"

# Copy any assets
echo "Copying assets..."
if [ -d "dist/assets" ]; then
  mkdir -p "$DEST_DIR/assets"
  cp -r dist/assets/* "$DEST_DIR/assets/"
fi

echo "Safari extension files have been prepared successfully!"