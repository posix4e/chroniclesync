#!/bin/bash
set -e

# This script converts the WebExtension to a Safari App Extension
# It requires Xcode and the safari-web-extension-converter tool

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if the iOS Safari extension zip exists
if [ ! -f "extension/ios-safari-extension.zip" ]; then
  echo "Building iOS Safari extension first..."
  cd extension
  npm run build:extension
  cd ..
fi

# Create a directory for the iOS extension project
mkdir -p ios-extension

# Convert the extension to a Safari App Extension
echo "Converting WebExtension to Safari App Extension..."
xcrun safari-web-extension-converter \
  ./extension/ios-safari-extension.zip \
  --project-location ./ios-extension \
  --app-name "ChronicleSync" \
  --bundle-identifier "com.chroniclesync.extension" \
  --swift \
  --force

echo "Safari App Extension created in ./ios-extension"