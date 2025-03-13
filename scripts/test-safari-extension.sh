#!/bin/bash
set -e

# This script builds and tests the Safari App Extension on iOS Simulator
# It requires Xcode and iOS Simulator

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if the iOS extension project exists
if [ ! -d "ios-extension/ChronicleSync" ]; then
  echo "Safari App Extension project not found. Creating it first..."
  ./scripts/convert-to-safari-extension.sh
fi

# Copy the UI test file to the project
echo "Copying UI test file to the project..."
mkdir -p ios-extension/ChronicleSync/ChronicleSyncUITests
cp scripts/SafariExtensionUITest.swift ios-extension/ChronicleSync/ChronicleSyncUITests/

# Get available simulators
echo "Available iOS Simulators:"
xcrun simctl list devices available | grep -i iphone

# Build and test the extension
echo "Building and testing Safari App Extension..."
cd ios-extension/ChronicleSync

# Build for testing
xcodebuild build-for-testing \
  -scheme "ChronicleSync" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 14,OS=latest" \
  -allowProvisioningUpdates \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Run tests
xcodebuild test \
  -scheme "ChronicleSync" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 14,OS=latest" \
  -allowProvisioningUpdates \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

echo "Safari App Extension testing completed"