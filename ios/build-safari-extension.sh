#!/bin/bash

# Script to build the Safari extension from the Chrome extension code

# Set paths
CHROME_EXT_DIR="../extension"
SAFARI_EXT_DIR="ChronicleSync/ChronicleSync Extension/Resources"

# Ensure the Safari extension directory exists
mkdir -p "$SAFARI_EXT_DIR"

# Build the Chrome extension
cd "$CHROME_EXT_DIR"
npm ci
npm run build

# Copy the built files to the Safari extension directory
cp dist/popup.html "$SAFARI_EXT_DIR/"
cp dist/popup.js "$SAFARI_EXT_DIR/"
cp dist/popup.css "$SAFARI_EXT_DIR/"
cp dist/settings.html "$SAFARI_EXT_DIR/"
cp dist/settings.js "$SAFARI_EXT_DIR/"
cp dist/settings.css "$SAFARI_EXT_DIR/"
cp dist/history.html "$SAFARI_EXT_DIR/"
cp dist/history.js "$SAFARI_EXT_DIR/"
cp dist/history.css "$SAFARI_EXT_DIR/"
cp dist/background.js "$SAFARI_EXT_DIR/"
cp dist/content-script.js "$SAFARI_EXT_DIR/"

echo "Safari extension built successfully!"