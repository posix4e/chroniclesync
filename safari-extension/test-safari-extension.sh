#!/bin/bash

# Exit on error
set -e

# Define paths
SAFARI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if required environment variables are set
if [ -z "${APPLE_APP_ID}" ]; then
  echo "Warning: APPLE_APP_ID environment variable is not set."
  echo "You can set it by running:"
  echo "export APPLE_APP_ID=your.app.bundle.id"
  echo ""
  echo "Using default value: com.chroniclesync.ChronicleSync"
  export APPLE_APP_ID="com.chroniclesync.ChronicleSync"
fi

# Check if we have a built app
if [ ! -d "$SAFARI_DIR/build/ChronicleSync.app" ]; then
  echo "Error: ChronicleSync.app not found. Please build the app first."
  exit 1
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
cd "$SAFARI_DIR"
bundle install

# Run fastlane to test the app
echo "Testing Safari extension with Fastlane..."
bundle exec fastlane test

echo "Test completed successfully!"
echo "Screenshot saved to: $SAFARI_DIR/screenshots/chroniclesync_screenshot.png"