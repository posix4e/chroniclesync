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

# Build the Xcode project using Fastlane
cd "$SAFARI_DIR"

# Check if required environment variables are set
if [ -z "${APPLE_TEAM_ID}" ] || [ -z "${APPLE_APP_ID}" ] || [ -z "${APPLE_ID}" ] || [ -z "${MATCH_GIT_URL}" ]; then
  echo "Warning: One or more required environment variables are not set."
  echo "Required variables:"
  echo "  - APPLE_TEAM_ID: Your Apple Developer Team ID"
  echo "  - APPLE_APP_ID: Your app's bundle identifier"
  echo "  - APPLE_ID: Your Apple ID email"
  echo "  - MATCH_GIT_URL: Git URL for your match certificates repository"
  echo ""
  echo "You can set them by running:"
  echo "export APPLE_TEAM_ID=your_team_id"
  echo "export APPLE_APP_ID=your.app.bundle.id"
  echo "export APPLE_ID=your@apple.id"
  echo "export MATCH_GIT_URL=https://github.com/your-org/certificates.git"
  echo ""
  echo "Attempting to build without these variables may fail."
fi

# Check if fastlane is installed
if ! command -v fastlane &> /dev/null; then
  echo "Fastlane not found. Installing..."
  gem install fastlane
fi

# Check if bundle is installed
if ! command -v bundle &> /dev/null; then
  echo "Bundler not found. Installing..."
  gem install bundler
fi

# Install dependencies
bundle install

# Run fastlane to build the app
echo "Building Safari extension with Fastlane..."
bundle exec fastlane build

echo "IPA file created at $SAFARI_DIR/build/ChronicleSync.ipa"